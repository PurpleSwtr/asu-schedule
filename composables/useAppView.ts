const currentView = ref<'schedule' | 'notes' | 'allNotes'>('schedule')

export const useAppView = () => {
  const setView = (v: 'schedule' | 'notes' | 'allNotes') => {
    currentView.value = v
  }

  return { currentView, setView }
}
