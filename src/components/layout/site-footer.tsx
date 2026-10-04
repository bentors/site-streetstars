import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { whatsappUrl, type StoreSettings } from '@/lib/store-settings'
import { CopyEmailButton } from './copy-email-button'

const MENU = [
  { label: 'Início', href: '/' },
  { label: 'Shop', href: '/#shop' },
  { label: 'Coleções', href: '/#colecoes' },
  { label: 'Manifesto', href: '/#manifesto' },
  { label: 'Quem somos', href: '/#sobre' },
]

const LEGAL = [
  { label: 'Política de Privacidade', href: '/legal/politica-de-privacidade' },
  { label: 'Termos de Uso', href: '/legal/termos-de-uso' },
  { label: 'Trocas e Devoluções', href: '/legal/trocas-e-devolucoes' },
]

const card =
  'group flex w-full items-center gap-3 rounded-sm border border-line bg-surface-2/30 p-2 transition-all hover:border-paper/30 hover:bg-surface-2'
const column = 'flex flex-col items-center text-center md:items-start md:text-left'
const heading = 'mb-6 text-xs font-bold tracking-widest text-paper/90 uppercase'
const listLink = 'block py-1 transition-colors hover:text-paper'

export function SiteFooter({ settings }: { settings: StoreSettings }) {
  const whatsapp = whatsappUrl(settings.whatsapp)
  const instagramHandle = settings.instagram.replace(/^@/, '')

  return (
    <footer id="contato" className="border-t border-line bg-ink pt-20 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className={`${column} space-y-6 md:col-span-4`}>
            <Link href="/" aria-label="Voltar ao início">
              <Logo className="h-16 w-auto text-paper opacity-90 transition-opacity hover:opacity-100" />
            </Link>
            <p className="max-w-xs text-xs leading-relaxed font-light text-paper/50">
              Street Stars.
              <br />
              Est. 2024 — São Paulo.
            </p>
            <div className="w-fit border-t border-line pt-4">
              <p className="font-display text-sm text-paper/80 italic">
                &ldquo;Da rua pra rua. <br /> Sem intermediários.&rdquo;
              </p>
            </div>
          </div>

          <div className={`${column} md:col-span-3`}>
            <h2 className={heading}>Contato</h2>
            <div className="flex w-full max-w-sm flex-col gap-4">
              {instagramHandle ? (
                <a
                  href={`https://www.instagram.com/${instagramHandle}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={card}
                >
                  <svg
                    className="size-5 shrink-0 text-paper/80 transition-colors group-hover:text-paper"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
                  </svg>
                  <span className="flex flex-col text-left">
                    <span className="text-[10px] tracking-wider text-paper/50 uppercase">
                      Instagram
                    </span>
                    <span className="text-xs font-bold">{settings.instagram}</span>
                  </span>
                </a>
              ) : null}
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={card}>
                  <svg
                    className="size-5 shrink-0 fill-current text-paper/80 transition-colors group-hover:text-paper"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  <span className="flex flex-col text-left">
                    <span className="text-[10px] tracking-wider text-paper/50 uppercase">
                      WhatsApp
                    </span>
                    <span className="text-xs font-bold">Fale conosco</span>
                  </span>
                </a>
              ) : null}
              <CopyEmailButton email={settings.email} className={card} />
            </div>
          </div>

          <nav aria-label="Menu do rodapé" className={`${column} md:col-span-2`}>
            <h2 className={heading}>Menu</h2>
            <ul className="w-full space-y-3 text-xs text-paper/50">
              {MENU.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={listLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Informações legais" className={`${column} md:col-span-3`}>
            <h2 className={heading}>Legal</h2>
            <ul className="w-full space-y-3 text-xs text-paper/50">
              {LEGAL.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={listLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Sem ano dinâmico: new Date() na renderização viola react-hooks/purity e envelheceria no cache. */}
        <p className="border-t border-paper/5 pt-8 text-center text-[11px] tracking-widest text-paper/50 uppercase md:text-left">
          © Street Stars. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
