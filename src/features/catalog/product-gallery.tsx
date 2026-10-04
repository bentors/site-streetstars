'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export function ProductGallery({
  images,
  activeUrl,
}: {
  images: { url: string; alt: string }[]
  activeUrl?: string | null
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const goTo = useCallback((target: number) => {
    const slider = ref.current
    if (!slider) return
    slider.scrollTo({ left: target * slider.clientWidth, behavior: 'smooth' })
  }, [])

  // Só rola quando a cor escolhida muda (a URL é o que importa, não a identidade do array).
  useEffect(() => {
    if (!activeUrl) return
    const target = images.findIndex((image) => image.url === activeUrl)
    if (target >= 0) goTo(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUrl, goTo])

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label="Fotos do produto"
        tabIndex={0}
        onScroll={(event) => {
          const slider = event.currentTarget
          setIndex(Math.round(slider.scrollLeft / slider.clientWidth))
        }}
        className="flex aspect-[4/5] snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto bg-surface lg:aspect-auto lg:h-[85vh]"
      >
        {images.map((image, i) => (
          <div key={image.url} className="relative h-full w-full shrink-0 snap-start">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              aria-current={index === i ? 'true' : undefined}
              onClick={() => goTo(i)}
              className="p-2"
            >
              <span
                className={cn(
                  'block size-1.5 rounded-full',
                  index === i ? 'bg-paper' : 'bg-paper/30',
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
