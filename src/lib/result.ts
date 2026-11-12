export type Failure = { ok: false; code: string; message: string }
export type Result<T> = { ok: true; data: T } | Failure

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function fail(code: string, message: string): Failure {
  return { ok: false, code, message }
}
