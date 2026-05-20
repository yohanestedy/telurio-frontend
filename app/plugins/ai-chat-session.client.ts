export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const { resetState } = useAiChat()

  watch(
    () => auth.user,
    (current, previous) => {
      if (previous && !current) {
        resetState()
      }
    },
  )
})
