export function useSummaryReload() {
  const summaryReloadKey = ref(0);

  function bumpSummaryReloadKey() {
    summaryReloadKey.value += 1;
  }

  return {
    summaryReloadKey,
    bumpSummaryReloadKey,
  };
}
