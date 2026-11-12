'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Modal } from '@/components/ui'

export function CollectionGallery({ title, images }: { title: string; images: string[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const current = selected === null ? null : images[selected]

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            aria-label={`Ampliar foto ${index + 1} de ${title}`}
            onClick={() => setSelected(index)}
            className="group relative aspect-[3/4] cursor-zoom-in overflow-hidden border border-line bg-surface"
          >
            <Image
              src={image}
              alt={`${title} — foto ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-1000 group-hover:scale-105 md:grayscale md:group-hover:grayscale-0"
            />
          </button>
        ))}
      </div>
      <Modal
        open={current !== null && current !== undefined}
        onClose={() => setSelected(null)}
        title={`${title} — foto ${(selected ?? 0) + 1}`}
        className="w-[min(100%-2rem,64rem)]"
      >
        {current ? (
          <div className="relative aspect-[3/4] max-h-[75vh] w-full">
            <Image
              src={current}
              alt={`${title} — foto ${(selected ?? 0) + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </>
  )
}
