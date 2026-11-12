// Copia o catálogo (produtos, coleções e settings/store) entre projetos Firebase.
// Uso: make catalog-export FILE=.backups/catalogo.json           (lê do projeto do .env.local)
//      make catalog-import FILE=... ENV=.env.prod.local    (grava só o que não existe)
import { readFileSync, writeFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { parseCatalog, serializeCatalog } from './lib/catalog-transfer'

function toPlain(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate()
  if (Array.isArray(value)) return value.map(toPlain)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]))
  }
  return value
}

async function main() {
  const [mode, file] = process.argv.slice(2)
  if ((mode !== 'export' && mode !== 'import') || !file) {
    throw new Error('Uso: catalog-transfer.ts export|import <arquivo>')
  }
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY')
  }
  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
  const db = getFirestore()

  if (mode === 'export') {
    const docs: { collection: string; id: string; data: unknown }[] = []
    for (const name of ['products', 'collections'] as const) {
      const snapshot = await db.collection(name).get()
      for (const doc of snapshot.docs) {
        docs.push({ collection: name, id: doc.id, data: toPlain(doc.data()) })
      }
    }
    const settings = await db.doc('settings/store').get()
    if (settings.exists)
      docs.push({ collection: 'settings', id: 'store', data: toPlain(settings.data()) })
    writeFileSync(file, serializeCatalog(docs))
    console.log(`✓ ${docs.length} documento(s) de ${FIREBASE_PROJECT_ID} exportados para ${file}`)
    return
  }

  const docs = parseCatalog(readFileSync(file, 'utf8'))
  console.log(`Projeto de destino: ${FIREBASE_PROJECT_ID}`)
  let created = 0
  let skipped = 0
  for (const doc of docs) {
    try {
      // create: nunca sobrescreve o que já existe no destino.
      await db.collection(doc.collection).doc(doc.id).create(doc.data)
      created += 1
    } catch (error) {
      // 6 = ALREADY_EXISTS no gRPC do Firestore.
      if ((error as { code?: number }).code === 6) skipped += 1
      else throw error
    }
  }
  console.log(`✓ ${created} criado(s), ${skipped} já existiam e foram mantidos.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
