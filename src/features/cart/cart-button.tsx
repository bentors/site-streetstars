'use client'

import { useCart } from './cart-context'

export function CartButton() {
  const { count, open } = useCart()
  const label =
    count > 0 ? `Abrir sacola (${count} ${count === 1 ? 'item' : 'itens'})` : 'Abrir sacola'
  return (
    <button
      type="button"
      onClick={open}
      aria-label={label}
      className="relative flex size-10 items-center justify-center text-paper/80 hover:text-paper"
    >
      <svg
        className="size-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {count > 0 ? (
        <span
          key={count}
          aria-hidden="true"
          className="absolute top-1 right-1 flex size-4 animate-pop items-center justify-center rounded-full bg-paper text-[10px] font-bold text-ink"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  )
}
