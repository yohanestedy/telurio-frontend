import { watch } from "vue";

type CreateQueryTriggerOptions = {
  triggerValue: string;
  open: () => void | Promise<void>;
  canOpen?: () => boolean;
};

export function useCreateQueryTrigger(options: CreateQueryTriggerOptions) {
  const route = useRoute();

  async function consumeCreateQuery(value: unknown) {
    if (value !== options.triggerValue) {
      return;
    }

    if (options.canOpen && !options.canOpen()) {
      return;
    }

    await options.open();

    const nextQuery = { ...route.query };
    delete nextQuery.create;
    await navigateTo({ path: route.path, query: nextQuery }, { replace: true });
  }

  watch(
    () => route.query.create,
    (value) => {
      consumeCreateQuery(value);
    },
    { immediate: true },
  );
}
