export function useSupportingOptions() {
  const auth = useAuthStore();
  const { coops, coopOptions, loadCoops } = useCoopOptions();
  const { owners, ownerOptions, loadOwners } = useOwnerOptions();

  async function loadCoopsAndOwners() {
    await Promise.all([
      loadCoops(),
      auth.role === "ADMIN"
        ? loadOwners().catch(() => undefined)
        : Promise.resolve(),
    ]);

    if (auth.role !== "ADMIN") {
      owners.value = [];
    }
  }

  return {
    coops,
    coopOptions,
    owners,
    ownerOptions,
    loadCoops,
    loadOwners,
    loadCoopsAndOwners,
  };
}
