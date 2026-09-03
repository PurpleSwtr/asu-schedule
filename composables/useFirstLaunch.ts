const ONBOARDING_KEY = 'asu-onboarding-done'

const showModal = ref(false)
const tooltipsEnabled = ref(false)
const closing = ref(false)

export const useFirstLaunch = () => {
  const init = () => {
    if (import.meta.server) return
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (done) {
      tooltipsEnabled.value = true
    } else {
      showModal.value = true
    }
  }

  const closeModal = () => {
    closing.value = true
    showModal.value = false
    localStorage.setItem(ONBOARDING_KEY, 'true')
    tooltipsEnabled.value = true
  }

  return { showModal, tooltipsEnabled, closing, init, closeModal }
}
