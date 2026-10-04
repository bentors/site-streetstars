'use client'

import { Children, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/** Carrossel com snap no celular (com indicadores) e grade de 3 colunas a partir do md. */
export function CollectionsCarousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const count = Children.count(children)

  function onScroll() {
    const slider = ref.current
    const first = slider?.firstElementChild as HTMLElement | null
    if (!slider || !first) return
    const atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10
    setCurrent(atEnd ? count - 1 : Math.round(slider.scrollLeft / (first.offsetWidth + 16)))
  }

  function goTo(index: number) {
    const slider = ref.current
    const first = slider?.firstElementChild as HTMLElement | null
    if (!slider || !first) return
    slider.scrollTo({ left: index * (first.offsetWidth + 16), behavior: 'smooth' })
  }

  return (
    <>
      <div
        ref={ref}
        onScroll={onScroll}
        className="-mx-6 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-6 pb-8 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0"
      >
        {children}
      </div>
      {count > 1 ? (
        <div className="mt-2 flex justify-center gap-2 md:hidden">
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ir para coleção ${index + 1}`}
              aria-current={current === index ? 'true' : undefined}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500 ease-out',
                current === index ? 'w-8 bg-paper' : 'w-1.5 bg-paper/20 hover:bg-paper/40',
              )}
            />
          ))}
        </div>
      ) : null}
    </>
  )
}
