export async function clearFirestore() {
  const host = process.env.FIRESTORE_EMULATOR_HOST
  const response = await fetch(
    `http://${host}/emulator/v1/projects/demo-streetstars/databases/(default)/documents`,
    { method: 'DELETE' },
  )
  if (!response.ok) throw new Error(`Falha ao limpar o emulador: ${response.status}`)
}
