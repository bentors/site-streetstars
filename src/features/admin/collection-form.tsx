'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, Field, Select, TextField } from '@/components/ui'
import { collectionFormSchema, type CollectionFormValues } from '@/lib/admin-collection'
import type { ProductImage } from '@/lib/catalog-schemas'
import { fieldErrors } from '@/lib/form-errors'
import { saveCollectionAction } from './catalog-actions'
import { ImageListField } from './image-list-field'

// O campo de imagens trabalha com ProductImage; coleções guardam só a URL.
const asImages = (urls: string[]): ProductImage[] =>
  urls.map((url) => ({ url, publicId: url, alt: '' }))
const asUrls = (images: ProductImage[]) => images.map((image) => image.url)

const textarea =
  'min-h-24 w-full border border-line bg-surface p-3 font-mono text-sm text-paper outline-none focus:border-paper'

export function CollectionForm({
  collectionId,
  initial,
}: {
  collectionId: string | null
  initial: CollectionFormValues
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const set = (patch: Partial<CollectionFormValues>) =>
    setValues((current) => ({ ...current, ...patch }))

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    const parsed = collectionFormSchema.safeParse(values)
    setErrors(parsed.success ? {} : fieldErrors(parsed.error))
    if (!parsed.success) return
    start(async () => {
      const result = await saveCollectionAction(collectionId, values)
      if (!result.ok) {
        // Erro de um campo aparece embaixo dele; o resto vai para a mensagem geral.
        const field = result.code === 'slug_taken' ? 'slug' : result.code.split(':')[1]
        if (field) setErrors({ [field]: result.message })
        else setStatus({ ok: false, text: result.message })
        return
      }
      if (collectionId === null) router.push(`/admin/colecoes/${result.data.id}`)
      else {
        setStatus({ ok: true, text: 'Coleção salva.' })
        router.refresh()
      }
    })
  }

  const area = (key: 'shortDescription' | 'body', label: string, hint?: string) => (
    <Field label={label} hint={hint} error={errors[key]}>
      {(control) => (
        <textarea
          {...control}
          className={textarea}
          value={values[key]}
          onChange={(e) => set({ [key]: e.target.value })}
        />
      )}
    </Field>
  )

  return (
    <form onSubmit={submit} noValidate className="flex max-w-3xl flex-col gap-6">
      <TextField
        label="Título"
        value={values.title}
        error={errors.title}
        onValue={(title) => set({ title })}
      />
      <TextField
        label="Endereço (slug)"
        placeholder="gerado a partir do título"
        value={values.slug}
        error={errors.slug}
        onValue={(slug) => set({ slug })}
      />
      {area('shortDescription', 'Descrição curta')}
      {area('body', 'Texto', 'Separe os parágrafos com uma linha em branco.')}
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Foto (crédito)"
          value={values.photo}
          onValue={(photo) => set({ photo })}
        />
        <TextField
          label="Direção"
          value={values.direction}
          onValue={(direction) => set({ direction })}
        />
        <TextField label="Styling" value={values.styling} onValue={(styling) => set({ styling })} />
      </div>
      <ImageListField
        label="Capa"
        max={1}
        value={asImages(values.coverImage ? [values.coverImage] : [])}
        onChange={(images) => set({ coverImage: asUrls(images)[0] ?? '' })}
        error={errors.coverImage}
      />
      <ImageListField
        label="Foto ao passar o mouse (opcional)"
        max={1}
        value={asImages(values.hoverImage ? [values.hoverImage] : [])}
        onChange={(images) => set({ hoverImage: asUrls(images)[0] ?? '' })}
      />
      <ImageListField
        label="Galeria"
        value={asImages(values.gallery)}
        onChange={(images) => set({ gallery: asUrls(images) })}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status">
          {(control) => (
            <Select
              {...control}
              value={values.status}
              onChange={(e) => set({ status: e.target.value as CollectionFormValues['status'] })}
            >
              <option value="draft">Oculta</option>
              <option value="published">Publicada</option>
            </Select>
          )}
        </Field>
        <TextField
          label="Ordem"
          inputMode="numeric"
          value={values.order}
          error={errors.order}
          onValue={(order) => set({ order })}
        />
        <TextField
          label="Lançamento"
          type="date"
          value={values.launchedAt}
          onValue={(launchedAt) => set({ launchedAt })}
        />
      </div>
      {status ? (
        <p role="status" className={status.ok ? 'text-xs text-success' : 'text-xs text-danger'}>
          {status.text}
        </p>
      ) : null}
      <Button type="submit" loading={pending} className="self-start">
        Salvar coleção
      </Button>
    </form>
  )
}
