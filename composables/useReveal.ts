import { ref, watch } from "vue"

export function useReveal(active: () => boolean | undefined) {
  const shown = ref(false)
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  watch(
    () => active(),
    (isActive) => {
      clearTimeout(resetTimer)
      if (isActive) {
        shown.value = false
        requestAnimationFrame(() => {
          shown.value = true
        })
      } else {
        resetTimer = setTimeout(() => {
          shown.value = false
        }, 400)
      }
    },
    { immediate: true },
  )

  return shown
}
