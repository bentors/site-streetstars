// Migra o catálogo do app antigo para o formato novo, no mesmo projeto Firebase.
// Uso: npm run migrate-catalog            (só mostra o que faria)
//      npm run migrate-catalog -- --apply (faz backup em .backups/ e grava)
import { mkdirSync, writeFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { formatBRL } from '../src/lib/money'
import { DEFAULT_STORE_SETTINGS } from '../src/lib/store-settings'
import {
  isMigrated,
  migrateProduct,
  uniqueSlugs,
  type LegacyProduct,
} from './lib/catalog-migration'
import { LEGACY_COLLECTIONS } from './lib/legacy-collections'

function toPlain(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate()
  if (Array.isArray(value)) return value.map(toPlain)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]))
  }
  return value
}

async function main() {
  const apply = process.argv.includes('--apply')
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      'Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env.local',
    )
  }
  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
  const db = getFirestore()
  const now = new Date()

  const snapshot = await db.collection('products').get()
  const pending = snapshot.docs.filter((doc) => !isMigrated(doc.data()))
  const legacy = pending.map((doc) => ({ id: doc.id, data: toPlain(doc.data()) as LegacyProduct }))
  const slugs = uniqueSlugs(legacy.map((item) => item.data.name))
  let featuredCount = 0

  const migrated = legacy.map((item, index) => {
    const featuredOrder = item.data.isFeatured ? featuredCount++ : null
    const doc = migrateProduct(item.data, { slug: slugs[index] ?? '', featuredOrder, now })
    return { id: item.id, doc }
  })

  console.log(`Projeto: ${FIREBASE_PROJECT_ID}`)
  console.log(`Produtos já no formato novo: ${snapshot.size - pending.length}`)
  console.table(
    migrated.map(({ id, doc }) => ({
      id,
      slug: doc.slug,
      preço: formatBRL(doc.priceCents),
      status: doc.status,
      peso: `${doc.weightGrams} g`,
      imagens: doc.images.length,
    })),
  )
  console.log(`Coleções: ${LEGACY_COLLECTIONS.map((c) => `${c.slug} (${c.status})`).join(', ')}`)

  if (!apply) {
    console.log('\nSimulação: nada foi gravado. Rode com --apply para gravar.')
    return
  }

  mkdirSync('.backups', { recursive: true })
  const backupFile = `.backups/catalog-${now.toISOString().replace(/[:.]/g, '-')}.json`
  writeFileSync(
    backupFile,
    JSON.stringify(
      snapshot.docs.map((doc) => ({ id: doc.id, data: toPlain(doc.data()) })),
      null,
      2,
    ),
  )
  console.log(`Backup dos produtos atuais: ${backupFile}`)

  const batch = db.batch()
  for (const { id, doc } of migrated) batch.set(db.collection('products').doc(id), doc)
  for (const collection of LEGACY_COLLECTIONS) {
    batch.set(db.collection('collections').doc(collection.slug), collection)
  }
  const settingsRef = db.doc('settings/store')
  if (!(await settingsRef.get()).exists) batch.set(settingsRef, DEFAULT_STORE_SETTINGS)
  await batch.commit()

  console.log(
    `✓ ${migrated.length} produto(s) e ${LEGACY_COLLECTIONS.length} coleção(ões) gravados.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
