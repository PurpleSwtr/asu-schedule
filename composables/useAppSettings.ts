const CONFETTI_KEY = 'asu-confetti-on-launch'
const TUTORIALS_KEY = 'asu-show-tutorials'

const confettiOnLaunch = ref(false)
const showTutorials = ref(true)

export const useAppSettings = () => {
  const init = () => {
    if (import.meta.server) return
    confettiOnLaunch.value = localStorage.getItem(CONFETTI_KEY) === 'true'
    showTutorials.value = localStorage.getItem(TUTORIALS_KEY) !== 'false'
  }

  const setConfettiOnLaunch = (value: boolean) => {
    confettiOnLaunch.value = value
    localStorage.setItem(CONFETTI_KEY, String(value))
  }

  const setShowTutorials = (value: boolean) => {
    showTutorials.value = value
    localStorage.setItem(TUTORIALS_KEY, String(value))
  }

  return {
    confettiOnLaunch,
    showTutorials,
    init,
    setConfettiOnLaunch,
    setShowTutorials,
  }
}