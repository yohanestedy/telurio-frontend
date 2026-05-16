import {
  ApiClientError,
  type ApiErrorPayload,
  type ApiSuccessResponse,
} from "../types/api";

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface ApiRequestOptions<TBody> {
  method?: ApiMethod;
  body?: TBody;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
}

function buildPath(path: string) {
  const config = useRuntimeConfig();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${config.public.apiBaseUrl}${config.public.apiPrefix}${normalizedPath}`;
}

function mapError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  const fetchError = error as {
    statusCode?: number;
    status?: number;
    code?: string;
    data?: ApiErrorPayload;
    message?: string;
    response?: { status?: number; _data?: ApiErrorPayload };
  };

  const status =
    fetchError.statusCode ??
    fetchError.status ??
    fetchError.response?.status ??
    500;

  const payload = fetchError.data ?? fetchError.response?._data;

  if (payload?.error) {
    return new ApiClientError({
      status,
      code: payload.error.code,
      message: payload.error.message,
      details: payload,
    });
  }

  return new ApiClientError({
    status,
    code: fetchError.code ?? "REQUEST_FAILED",
    message: fetchError.message ?? "Unable to complete request",
    details: fetchError,
  });
}

function unwrapResponse<T>(response: T | ApiSuccessResponse<T>): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in (response as Record<string, unknown>)
  ) {
    return (response as ApiSuccessResponse<T>).data;
  }

  return response as T;
}

function isAuthRefreshExcludedPath(path: string) {
  return ["/auth/login", "/auth/refresh", "/auth/logout"].some((authPath) =>
    path.startsWith(authPath),
  );
}

export function useApi() {
  const auth = useAuthStore();
  const ui = useUiStore();

  async function requestEnvelope<TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
    retrying = false,
  ) {
    const method = options.method ?? "GET";
    const headers = new Headers();

    if (options.auth !== false && auth.token) {
      headers.set("Authorization", `Bearer ${auth.token}`);
    }

    try {
      return await $fetch<ApiSuccessResponse<TResponse>>(buildPath(path), {
        method,
        headers,
        body: options.body as
          | BodyInit
          | Record<string, unknown>
          | null
          | undefined,
        query: options.query,
        credentials: "include",
      });
    } catch (error) {
      const mapped = mapError(error);
      const canRefresh =
        import.meta.client &&
        mapped.status === 401 &&
        options.auth !== false &&
        !retrying &&
        !isAuthRefreshExcludedPath(path);

      if (canRefresh) {
        const refreshedToken = await auth.refreshSession();
        if (refreshedToken) {
          return requestEnvelope<TResponse, TBody>(path, options, true);
        }
      }

      if (
        import.meta.client &&
        mapped.status === 401 &&
        options.auth !== false
      ) {
        auth.clearSession();
        ui.requireUnauthorizedLogout(mapped.message);
      }

      throw mapped;
    }
  }

  return {
    request,
    get<TResponse>(path: string, query?: ApiRequestOptions<never>["query"]) {
      return request<TResponse>(path, { method: "GET", query });
    },
    async getPage<TResponse>(
      path: string,
      query?: ApiRequestOptions<never>["query"],
    ) {
      return requestEnvelope<TResponse>(path, { method: "GET", query });
    },
    post<TResponse, TBody = unknown>(
      path: string,
      body?: TBody,
      options?: Omit<ApiRequestOptions<TBody>, "body" | "method">,
    ) {
      return request<TResponse, TBody>(path, {
        ...options,
        method: "POST",
        body,
      });
    },
    patch<TResponse, TBody = unknown>(path: string, body?: TBody) {
      return request<TResponse, TBody>(path, { method: "PATCH", body });
    },
    delete<TResponse, TBody = unknown>(path: string, body?: TBody) {
      return request<TResponse, TBody>(path, { method: "DELETE", body });
    },
    mapError,
  };

  async function request<TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
  ) {
    const response = await requestEnvelope<TResponse, TBody>(path, options);
    return unwrapResponse(response);
  }
}
