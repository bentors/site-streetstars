import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { whatsappUrl, type StoreSettings } from '@/lib/store-settings'

const LEGAL = [
  { label: 'Política de Privacidade', href: '/legal/politica-de-privacidade' },
  { label: 'Termos de Uso', href: '/legal/termos-de-uso' },
  { label: 'Trocas e Devoluções', href: '/legal/trocas-e-devolucoes' },
]

export function SiteFooter({ settings }: { settings: StoreSettings }) {
  const whatsapp = whatsappUrl(settings.whatsapp)
  const instagramHandle = settings.instagram.replace(/^@/, '')

  return (
    <footer id="contato" className="scroll-mt-20 border-t border-line bg-ink pt-20 pb-8">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Logo className="h-14 w-auto text-paper" />
          <p className="text-xs leading-relaxed text-muted">
            Street Stars. Est. 2024 — São Paulo.
            <br />
            &ldquo;Da rua pra rua. Sem intermediários.&rdquo;
          </p>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <h2 className="mb-2 font-bold tracking-widest uppercase">Contato</h2>
          {instagramHandle ? (
            <a
              href={`https://www.instagram.com/${instagramHandle}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-paper"
            >
              Instagram {settings.instagram}
            </a>
          ) : null}
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-paper"
            >
              WhatsApp — fale conosco
            </a>
          ) : null}
          <p className="font-mono text-muted">{settings.email}</p>
        </div>

        <nav aria-label="Informações legais" className="flex flex-col gap-3 text-xs">
          <h2 className="mb-2 font-bold tracking-widest uppercase">Legal</h2>
          {LEGAL.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted hover:text-paper">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {/* Sem ano dinâmico: new Date() na renderização viola react-hooks/purity e envelheceria no cache. */}
      <p className="mx-auto mt-16 max-w-7xl px-6 text-[11px] tracking-widest text-muted uppercase">
        © Street Stars. Todos os direitos reservados.
      </p>
    </footer>
  )
}
