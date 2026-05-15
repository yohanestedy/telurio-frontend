import type { Ref } from "vue";

interface UsePaginatedLoaderOptions<TData> {
  loading: Ref<boolean>;
  error: Ref<string>;
  assignData: (data: TData) => void;
  fetchPage: () => Promise<{ data: TData; meta?: unknown }>;
  applyMeta: (meta?: unknown) => void;
  mapError: (caught: unknown) => { message: string };
}

/**
 * Standardizes paginated page loading flow:
 * - toggles loading
 * - resets/sets error message
 * - assigns list data
 * - applies pagination meta
 */
export function usePaginatedLoader<TData>(
  options: UsePaginatedLoaderOptions<TData>,
) {
  const load = async () => {
    options.loading.value = true;
    options.error.value = "";

    try {
      const response = await options.fetchPage();
      options.assignData(response.data);
      options.applyMeta(response.meta);
    } catch (caught) {
      options.error.value = options.mapError(caught).message;
    } finally {
      options.loading.value = false;
    }
  };

  return { load };
}
