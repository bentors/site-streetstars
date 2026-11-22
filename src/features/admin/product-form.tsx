'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, Checkbox, Field, Input, Select, TextField } from '@/components/ui'
import { productFormSchema, type ProductFormValues } from '@/lib/admin-product'
import { CATEGORIES } from '@/lib/catalog'
import { fieldErrors } from '@/lib/form-errors'
import { saveProductAction } from './catalog-actions'
import { ImageListField } from './image-list-field'
import { attempt } from '@/lib/attempt'

const textarea =
  'min-h-24 w-full border border-line bg-surface p-3 font-mono text-sm text-paper outline-none focus:border-paper aria-invalid:border-danger'

function TextArea({
  label,
  value,
  onValue,
  error,
  hint,
}: {
  label: string
  value: string
  onValue: (value: string) => void
  error?: string
  hint?: string
}) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(control) => (
        <textarea
          {...control}
          className={textarea}
          value={value}
          onChange={(e) => onValue(e.target.value)}
        />
      )}
    </Field>
  )
}

export function ProductForm({
  productId,
  initial,
  collections,
}: {
  productId: string | null
  initial: ProductFormValues
  collections: { id: string; title: string }[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  // Salvar no meio do upload perderia as fotos que ainda estão subindo.
  const [uploading, setUploading] = useState(false)
  const set = (patch: Partial<ProductFormValues>) =>
    setValues((current) => ({ ...current, ...patch }))
  const setColor = (index: number, patch: Partial<ProductFormValues['colors'][number]>) =>
    setValues((current) => {
      const before = current.colors[index]?.name
      // Só leva as marcações se nenhuma outra cor tem o mesmo nome (ex.: digitando "Preto Fosco"
      // com "Preto" já cadastrado, o nome passa por "Preto" e não pode roubar as fotos dele).
      // Vazio também conta: apagar o nome inteiro e digitar outro mantém as fotos com a cor.
      const owns =
        before !== undefined &&
        patch.name !== undefined &&
        !current.colors.some((c, i) => i !== index && c.name === before)
      const rename = (name: string) => (owns && name === before ? (patch.name as string) : name)
      return {
        ...current,
        colors: current.colors.map((c, i) => (i === index ? { ...c, ...patch } : c)),
        // Renomear a cor leva junto as fotos marcadas com ela.
        images: current.images.map((image) => ({ ...image, colors: image.colors.map(rename) })),
      }
    })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    const parsed = productFormSchema.safeParse(values)
    setErrors(parsed.success ? {} : fieldErrors(parsed.error))
    if (!parsed.success) return
    start(async () => {
      const result = await attempt(() => saveProductAction(productId, values))
      if (!result.ok) {
        // Erro de um campo aparece embaixo dele; o resto vai para a mensagem geral.
        const field = result.code === 'slug_taken' ? 'slug' : result.code.split(':')[1]
        if (field) setErrors({ [field]: result.message })
        else setStatus({ ok: false, text: result.message })
        return
      }
      if (productId === null) router.push(`/admin/produtos/${result.data.id}`)
      else {
        setStatus({ ok: true, text: 'Produto salvo.' })
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-3xl flex-col gap-6">
      <TextField
        label="Nome"
        value={values.name}
        error={errors.name}
        onValue={(name) => set({ name })}
      />
      <TextField
        label="Endereço (slug)"
        placeholder="gerado a partir do nome"
        value={values.slug}
        error={errors.slug}
        onValue={(slug) => set({ slug })}
      />
      <TextArea
        label="Descrição"
        value={values.description}
        error={errors.description}
        onValue={(description) => set({ description })}
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Categoria" error={errors.category}>
          {(control) => (
            <Select
              {...control}
              value={values.category}
              onChange={(e) => set({ category: e.target.value })}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <TextField
          label="Preço (R$)"
          inputMode="decimal"
          value={values.price}
          error={errors.price}
          onValue={(price) => set({ price })}
        />
        <TextField
          label="Peso (g)"
          inputMode="numeric"
          value={values.weightGrams}
          error={errors.weightGrams}
          onValue={(weightGrams) => set({ weightGrams })}
        />
        <TextField
          label="Dias de produção"
          inputMode="numeric"
          value={values.productionDays}
          error={errors.productionDays}
          onValue={(productionDays) => set({ productionDays })}
        />
      </div>
      <TextField
        label="Tamanhos (separados por vírgula)"
        value={values.sizes}
        error={errors.sizes}
        onValue={(sizes) => set({ sizes })}
      />
      <ImageListField
        label="Fotos (a primeira é a capa)"
        hint="Marque as cores de cada foto. Sem cor marcada, a foto abre a galeria e aparece em todas as cores."
        colors={[...new Set(values.colors.map((color) => color.name).filter(Boolean))]}
        value={values.images}
        onChange={(update) => setValues((c) => ({ ...c, images: update(c.images) }))}
        onUploadingChange={setUploading}
        withAlt
        error={errors.images}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-mono text-[10px] tracking-widest text-muted uppercase">
          Cores
        </legend>
        {values.colors.map((color, index) => (
          <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_120px_auto]">
            <TextField
              label={`Nome da cor ${index + 1}`}
              value={color.name}
              onValue={(name) => setColor(index, { name })}
            />
            <Field label={`Cor ${index + 1}`}>
              {(control) => (
                <Input
                  {...control}
                  type="color"
                  value={color.hex}
                  onChange={(e) => setColor(index, { hex: e.target.value })}
                />
              )}
            </Field>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setValues((current) => {
                  const colors = current.colors.filter((_, i) => i !== index)
                  const names = new Set(colors.map((c) => c.name))
                  return {
                    ...current,
                    colors,
                    // Sem isso, recriar uma cor com o mesmo nome traria as marcações antigas.
                    images: current.images.map((image) => ({
                      ...image,
                      colors: image.colors.filter((name) => names.has(name)),
                    })),
                  }
                })
              }
            >
              Remover
            </Button>
          </div>
        ))}
        {errors.colors ? (
          <p className="font-mono text-[10px] text-danger">{errors.colors}</p>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => set({ colors: [...values.colors, { name: '', hex: '#000000' }] })}
        >
          Adicionar cor
        </Button>
      </fieldset>

      <TextArea
        label="Destaques (um por linha)"
        value={values.highlights}
        onValue={(highlights) => set({ highlights })}
      />
      <TextArea
        label="Guia de medidas"
        hint="1ª linha: colunas separadas por ; (a primeira é o tamanho). Depois, uma linha por tamanho: P; 50; 70"
        value={values.sizeGuide}
        error={errors.sizeGuide}
        onValue={(sizeGuide) => set({ sizeGuide })}
      />

      {collections.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[10px] tracking-widest text-muted uppercase">
            Coleções
          </legend>
          {collections.map((collection) => (
            <Checkbox
              key={collection.id}
              label={collection.title}
              checked={values.collectionIds.includes(collection.id)}
              onChange={(e) =>
                set({
                  collectionIds: e.target.checked
                    ? [...values.collectionIds, collection.id]
                    : values.collectionIds.filter((id) => id !== collection.id),
                })
              }
            />
          ))}
        </fieldset>
      ) : null}

      <Field label="Status">
        {(control) => (
          <Select
            {...control}
            value={values.status}
            onChange={(e) => set({ status: e.target.value as ProductFormValues['status'] })}
          >
            <option value="draft">Rascunho</option>
            <option value="active">À venda</option>
            <option value="archived">Arquivado</option>
          </Select>
        )}
      </Field>

      {status ? (
        <p role="status" className={status.ok ? 'text-xs text-success' : 'text-xs text-danger'}>
          {status.text}
        </p>
      ) : null}
      <Button type="submit" loading={pending} disabled={uploading} className="self-start">
        Salvar produto
      </Button>
    </form>
  )
}
