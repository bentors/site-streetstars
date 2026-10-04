import { whatsappUrl, type StoreSettings } from '@/lib/store-settings'

export function WhatsAppButton({ settings }: { settings: StoreSettings }) {
  const url = whatsappUrl(
    settings.whatsapp,
    'Olá! Vim pelo site da Street Stars e gostaria de mais informações.',
  )
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-6 bottom-6 z-30 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl hover:brightness-110"
    >
      <svg className="size-7 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
      </svg>
    </a>
  )
}
