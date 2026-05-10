export function useScrollToFirstFormError() {
  async function scrollToFirstFormError(root?: HTMLElement | null) {
    await nextTick();

    const container = root ?? document.body;
    const errorElement = container.querySelector<HTMLElement>(
      '[data-field-error="true"], .text-rose-600',
    );

    if (!errorElement) {
      return;
    }

    const fieldWrapper =
      errorElement.closest<HTMLElement>('label, [data-form-field="true"]') ??
      errorElement;

    fieldWrapper.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    const focusable = fieldWrapper.querySelector<HTMLElement>(
      "input, select, textarea, button:not([disabled])",
    );
    focusable?.focus({ preventScroll: true });
  }

  return { scrollToFirstFormError };
}
