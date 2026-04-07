import type { PaginatedMeta } from './domain'

export interface ApiSuccessResponse<T> {
  data: T
  meta?: PaginatedMeta
}

export interface ApiErrorPayload {
  error: {
    code: string
    message: string
  }
}

export interface PaginationState {
  page: number
  limit: number
  total: number
}

export class ApiClientError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(params: {
    message: string
    status?: number
    code?: string
    details?: unknown
  }) {
    super(params.message)
    this.name = 'ApiClientError'
    this.status = params.status ?? 500
    this.code = params.code ?? 'UNKNOWN_ERROR'
    this.details = params.details
  }
}
