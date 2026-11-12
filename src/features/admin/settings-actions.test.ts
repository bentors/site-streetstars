import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdmin = vi.hoisted(() => vi.fn())
const updateTag = vi.hoisted(() => vi.fn())
const saveStoreSettings = vi.hoisted(() => vi.fn())
vi.mock('@/server/auth/session', () => ({ requireAdmin }))
vi.mock('next/cache', () => ({ updateTag }))
vi.mock('@/server/db/settings', () => ({ saveStoreSettings }))
vi.mock('@/server/catalog', () => ({ CATALOG_TAG: 'catalog' }))

import { settingsToForm } from '@/lib/admin-settings'
import { DEFAULT_STORE_SETTINGS } from '@/lib/store-settings'
import { updateSettingsAction } from './settings-actions'

beforeEach(() => {
  vi.resetAllMocks()
  requireAdmin.mockResolvedValue({ uid: 'admin' })
})

describe('updateSettingsAction', () => {
  it('grava e atualiza a vitrine', async () => {
    expect(await updateSettingsAction(settingsToForm(DEFAULT_STORE_SETTINGS))).toEqual({
      ok: true,
      data: null,
    })
    expect(saveStoreSettings).toHaveBeenCalledWith(DEFAULT_STORE_SETTINGS)
    expect(updateTag).toHaveBeenCalledWith('catalog')
  })

  it('inválido não grava', async () => {
    await updateSettingsAction({ ...settingsToForm(DEFAULT_STORE_SETTINGS), email: 'x' })
    expect(saveStoreSettings).not.toHaveBeenCalled()
  })

  it('exige admin', async () => {
    requireAdmin.mockRejectedValue(new Error('NOT_FOUND'))
    await expect(updateSettingsAction({})).rejects.toThrow()
  })
})
