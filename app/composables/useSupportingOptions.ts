export function useSupportingOptions() {
  const auth = useAuthStore();
  const { coops, coopOptions, loadCoops } = useCoopOptions();
  const { owners, ownerOptions, loadOwners } = useOwnerOptions();

  async function loadOwnersForAdmin() {
    if (auth.role === "ADMIN") {
      await loadOwners().catch(() => undefined);
      return;
    }

    owners.value = [];
  }

  async function loadCoopsAndOwners() {
    await Promise.all([loadCoops(), loadOwnersForAdmin()]);
  }

  return {
    coops,
    coopOptions,
    owners,
    ownerOptions,
    loadCoops,
    loadOwners,
    loadOwnersForAdmin,
    loadCoopsAndOwners,
  };
}
