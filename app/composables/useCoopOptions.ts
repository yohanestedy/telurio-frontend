import type { CoopItem } from "../types/domain";

export function useCoopOptions() {
  const api = useApi();

  const coops = ref<CoopItem[]>([]);
  const loadingCoops = ref(false);
  const coopError = ref("");

  const coopOptions = computed(() =>
    coops.value.map((item) => ({ label: item.name, value: item.id })),
  );

  async function loadCoops(
    query: Record<string, string | number | boolean | null | undefined> = {
      all: true,
    },
  ) {
    loadingCoops.value = true;
    coopError.value = "";

    try {
      const response = await api.getPage<CoopItem[]>("/coops", query);
      coops.value = response.data;
    } catch (caught) {
      coopError.value = api.mapError(caught).message;
      throw caught;
    } finally {
      loadingCoops.value = false;
    }
  }

  return {
    coops,
    coopOptions,
    loadingCoops,
    coopError,
    loadCoops,
  };
}
