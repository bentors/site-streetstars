'use client'

import Image from 'next/image'
import { useId, useState } from 'react'
import { Button, Input, Spinner } from '@/components/ui'
import type { ProductImage } from '@/lib/catalog-schemas'
import { uploadImage } from './upload-image'

type Update = (current: ProductImage[]) => ProductImage[]

export function ImageListField({
  label,
  value,
  onChange,
  onUploadingChange,
  max,
  withAlt = false,
  error,
}: {
  label: string
  value: ProductImage[]
  /** Sempre uma atualização sobre o estado atual: o upload termina depois de outras edições. */
  onChange: (update: Update) => void
  onUploadingChange?: (uploading: boolean) => void
  max?: number
  withAlt?: boolean
  error?: string
}) {
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const full = max !== undefined && value.length >= max

  function move(index: number, delta: number) {
    onChange((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      if (!item) return current
      next.splice(index + delta, 0, item)
      return next
    })
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return
    const queue = Array.from(files).slice(0, max ? max - value.length : undefined)
    setMessage(null)
    setUploading(true)
    onUploadingChange?.(true)
    try {
      for (const file of queue) {
        const image = await uploadImage(file)
        // Acrescenta sobre o estado atual: edições feitas durante o upload ficam.
        onChange((current) => [...current, image])
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível enviar a foto.')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-mono text-[10px] tracking-widest text-muted uppercase">
        {label}
      </legend>
      <ul className="flex flex-col gap-3">
        {value.map((image, index) => (
          <li
            key={`${image.publicId}-${index}`}
            className="flex items-center gap-3 border border-line p-2"
          >
            <Image
              src={image.url}
              alt={image.alt}
              width={64}
              height={64}
              className="size-16 object-cover"
            />
            {withAlt ? (
              <Input
                aria-label={`Descrição da foto ${index + 1}`}
                placeholder="Descrição (acessibilidade)"
                value={image.alt}
                onChange={(event) => {
                  const alt = event.target.value
                  onChange((current) =>
                    current.map((item, i) => (i === index ? { ...item, alt } : item)),
                  )
                }}
              />
            ) : (
              <span className="flex-1 truncate font-mono text-[10px] text-muted">{image.url}</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              aria-label="Mover para cima"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              ↑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Mover para baixo"
              disabled={index === value.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange((current) => current.filter((_, i) => i !== index))}
            >
              Remover
            </Button>
          </li>
        ))}
      </ul>
      {full ? null : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center gap-3 text-xs underline"
        >
          {uploading ? <Spinner size="sm" /> : null}
          Adicionar fotos
          <input
            id={inputId}
            type="file"
            accept="image/*"
            multiple={max !== 1}
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              void upload(event.target.files)
              event.target.value = ''
            }}
          />
        </label>
      )}
      {message || error ? (
        <p role="alert" className="font-mono text-[10px] text-danger">
          {message ?? error}
        </p>
      ) : null}
    </fieldset>
  )
}
