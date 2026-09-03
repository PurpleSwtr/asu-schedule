const ONBOARDING_KEY = "asu-onboarding-done"

const tooltipsEnabled = ref(false)

export const useFirstLaunch = () => {
  const init = () => {
    if (import.meta.server) return
    if (localStorage.getItem(ONBOARDING_KEY)) {
      tooltipsEnabled.value = true
    }
  }

  const markOnboardingDone = () => {
    localStorage.setItem(ONBOARDING_KEY, "true")
    tooltipsEnabled.value = true
  }

  return { tooltipsEnabled, init, markOnboardingDone }
}