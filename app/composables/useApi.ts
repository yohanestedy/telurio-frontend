import { ApiClientError, type ApiErrorPayload, type ApiSuccessResponse } from '../types/api'

type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface ApiRequestOptions<TBody> {
  method?: ApiMethod
  body?: TBody
  query?: Record<string, string | number | boolean | undefined | null>
  auth?: boolean
}

function buildPath(path: string) {
  const config = useRuntimeConfig()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${config.public.apiBaseUrl}${config.public.apiPrefix}${normalizedPath}`
}

function mapError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error
  }

  const fetchError = error as {
    statusCode?: number
    status?: number
    code?: string
    data?: ApiErrorPayload
    message?: string
    response?: { status?: number; _data?: ApiErrorPayload }
  }

  const status =
    fetchError.statusCode ??
    fetchError.status ??
    fetchError.response?.status ??
    500

  const payload = fetchError.data ?? fetchError.response?._data

  if (payload?.error) {
    return new ApiClientError({
      status,
      code: payload.error.code,
      message: payload.error.message,
      details: payload,
    })
  }

  return new ApiClientError({
    status,
    code: fetchError.code ?? 'REQUEST_FAILED',
    message: fetchError.message ?? 'Unable to complete request',
    details: fetchError,
  })
}

export function useApi() {
  const auth = useAuthStore()
  const ui = useUiStore()

  async function requestEnvelope<TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
  ) {
    const method = options.method ?? 'GET'
    const headers = new Headers()

    if (options.auth !== false) {
      auth.syncTokenFromCookie()
      if (auth.token) {
        headers.set('Authorization', `Bearer ${auth.token}`)
      }
    }

    try {
      return await $fetch<ApiSuccessResponse<TResponse>>(buildPath(path), {
        method,
        headers,
        body: options.body,
        query: options.query,
      })
    } catch (error) {
      const mapped = mapError(error)

      if (mapped.status === 401 && options.auth !== false) {
        ui.requireUnauthorizedLogout(mapped.message)
      }

      throw mapped
    }
  }

  return {
    request,
    get<TResponse>(path: string, query?: ApiRequestOptions<never>['query']) {
      return request<TResponse>(path, { method: 'GET', query })
    },
    async getPage<TResponse>(
      path: string,
      query?: ApiRequestOptions<never>['query'],
    ) {
      return requestEnvelope<TResponse>(path, { method: 'GET', query })
    },
    post<TResponse, TBody = unknown>(path: string, body?: TBody, options?: Omit<ApiRequestOptions<TBody>, 'body' | 'method'>) {
      return request<TResponse, TBody>(path, { ...options, method: 'POST', body })
    },
    patch<TResponse, TBody = unknown>(path: string, body?: TBody) {
      return request<TResponse, TBody>(path, { method: 'PATCH', body })
    },
    delete<TResponse, TBody = unknown>(path: string, body?: TBody) {
      return request<TResponse, TBody>(path, { method: 'DELETE', body })
    },
    mapError,
  }

  async function request<TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
  ) {
    const response = await requestEnvelope<TResponse, TBody>(path, options)
    return response.data
  }
}
