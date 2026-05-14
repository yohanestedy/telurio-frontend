import { ref, watch, type Ref } from "vue";
import { generateIdempotencyKey } from "../utils/idempotency";

type Nullable<T> = T | null;

export function useIdempotentCreateDialog<TEditing>(
  dialogOpen: Ref<boolean>,
  editing: Ref<Nullable<TEditing>>,
) {
  const idempotencyKey = ref<string | null>(null);

  function openCreateDialog() {
    editing.value = null;
    idempotencyKey.value = generateIdempotencyKey();
    dialogOpen.value = true;
  }

  function openEditDialog(value: TEditing) {
    editing.value = value;
    idempotencyKey.value = null;
    dialogOpen.value = true;
  }

  function getOrCreateIdempotencyKey() {
    const value = idempotencyKey.value ?? generateIdempotencyKey();
    idempotencyKey.value = value;
    return value;
  }

  function clearIdempotencyKey() {
    idempotencyKey.value = null;
  }

  watch(dialogOpen, (open) => {
    if (!open) {
      idempotencyKey.value = null;
    } else if (!editing.value && !idempotencyKey.value) {
      idempotencyKey.value = generateIdempotencyKey();
    }
  });

  return {
    idempotencyKey,
    openCreateDialog,
    openEditDialog,
    getOrCreateIdempotencyKey,
    clearIdempotencyKey,
  };
}
