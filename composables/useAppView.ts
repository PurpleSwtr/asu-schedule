const currentView = ref<'schedule' | 'notes'>('schedule')

export const useAppView = () => {
  const setView = (v: 'schedule' | 'notes') => {
    currentView.value = v
  }

  return { currentView, setView }
}
