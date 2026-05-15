import type { UserItem } from "../types/domain";

export function useOwnerOptions() {
  const api = useApi();

  const owners = ref<UserItem[]>([]);
  const loadingOwners = ref(false);
  const ownerError = ref("");

  const ownerOptions = computed(() =>
    owners.value.map((item) => ({ label: item.name, value: item.id })),
  );

  async function loadOwners() {
    loadingOwners.value = true;
    ownerError.value = "";

    try {
      const response = await api.getPage<UserItem[]>("/users", {
        all: true,
        role: "OWNER",
      });
      owners.value = response.data;
    } catch (caught) {
      ownerError.value = api.mapError(caught).message;
      throw caught;
    } finally {
      loadingOwners.value = false;
    }
  }

  return {
    owners,
    ownerOptions,
    loadingOwners,
    ownerError,
    loadOwners,
  };
}
