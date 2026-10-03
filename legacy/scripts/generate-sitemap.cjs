/**
 * Gera public/sitemap.xml com rotas estáticas + produtos ativos do Firestore.
 * Executa antes do build: "npm run sitemap"
 *
 * Requer localmente: firebase-service-account.json (nunca commitar)
 * Requer no Vercel:  variável FIREBASE_SERVICE_ACCOUNT_JSON (JSON em uma linha)
 */

require('dotenv').config()

const admin = require('firebase-admin')
const fs    = require('fs')
const path  = require('path')

// ── Inicializa Firebase Admin ─────────────────────────────────────────────────
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : require('../firebase-service-account.json')

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

// ── Configurações ─────────────────────────────────────────────────────────────
const SITE_URL = 'https://streetstars.vercel.app'
const OUTPUT   = path.resolve(__dirname, '../public/sitemap.xml')

// IDs das coleções (correspondem ao id numérico em src/data/collections.js)
// Atualize aqui quando adicionar novas coleções
const COLLECTION_IDS = [0, 1]  // id 2 é "em construção", não indexar ainda

const STATIC_ROUTES = [
  { url: '/',                          priority: '1.0', changefreq: 'weekly'  },
  { url: '/collection/0',              priority: '0.7', changefreq: 'monthly' },
  { url: '/collection/1',              priority: '0.7', changefreq: 'monthly' },
  { url: '/legal/termos-de-uso',       priority: '0.2', changefreq: 'yearly'  },
  { url: '/legal/politica-de-privacidade', priority: '0.2', changefreq: 'yearly' },
]

// ── Geração ───────────────────────────────────────────────────────────────────
async function generate() {
  console.log('🗺️  Gerando sitemap...')

  const db   = admin.firestore()
  const snap = await db
    .collection('products')
    .where('isActive', '==', true)
    .get()

  const today = new Date().toISOString().split('T')[0]

  const productRoutes = snap.docs.map(doc => {
    const data    = doc.data()
    const lastmod = data.updated_at?.toDate?.()?.toISOString?.()?.split('T')[0] ?? today
    return {
      url:        `/product/${doc.id}`,
      priority:   '0.8',
      changefreq: 'weekly',
      lastmod,
    }
  })

  const allRoutes = [...STATIC_ROUTES, ...productRoutes]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(r => `  <url>
    <loc>${SITE_URL}${r.url}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>${r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`

  fs.writeFileSync(OUTPUT, xml, 'utf-8')
  console.log(`✅ Sitemap gerado: ${snap.docs.length} produtos + ${STATIC_ROUTES.length} rotas estáticas → public/sitemap.xml`)
  process.exit(0)
}

generate().catch(err => {
  // Em CI/build, falha no sitemap não deve derrubar o deploy inteiro
  // Loga o erro mas deixa o build continuar com o sitemap anterior (se existir)
  console.error('❌ Erro ao gerar sitemap:', err.message)
  process.exit(0)
})