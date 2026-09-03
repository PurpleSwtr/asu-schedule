const NOTES_KEY = 'asu-schedule-notes'

export const DAY_NOTE_PARA = 0

export interface LessonNote {
  text: string
  icon: string
  color: string
}

export const noteColorStyle = (colorName: string) => {
  const c = NOTE_COLORS.find(x => x.name === colorName)
  return {
    borderColor: c?.hex || '#9ca3af',
    backgroundColor: c ? `${c.hex}1a` : '#9ca3af1a',
  }
}

const NOTE_ICONS = [
  'i-lucide-circle',
  'i-lucide-book-open',
  'i-lucide-file-text',
  'i-lucide-star',
  'i-lucide-alert-circle',
  'i-lucide-check-circle',
  'i-lucide-clock',
  'i-lucide-calendar',
  'i-lucide-pin',
  'i-lucide-zap',
  'i-lucide-heart',
  'i-lucide-flag',
  'i-lucide-party-popper',
  'i-lucide-cake',
  'i-lucide-gift',
  'i-lucide-heart-handshake',
  'i-lucide-smile',
  'i-lucide-music-2',
  'i-lucide-coffee',
  'i-lucide-utensils',
  'i-lucide-trophy',
]

const NOTE_COLORS = [
  { name: 'gray', border: 'border-gray-400', bg: 'bg-gray-50', hex: '#9ca3af' },
  { name: 'blue', border: 'border-blue-400', bg: 'bg-blue-50', hex: '#60a5fa' },
  { name: 'green', border: 'border-green-400', bg: 'bg-green-50', hex: '#4ade80' },
  { name: 'amber', border: 'border-amber-400', bg: 'bg-amber-50', hex: '#fbbf24' },
  { name: 'red', border: 'border-red-400', bg: 'bg-red-50', hex: '#f87171' },
  { name: 'violet', border: 'border-violet-400', bg: 'bg-violet-50', hex: '#a78bfa' },
  { name: 'cyan', border: 'border-cyan-400', bg: 'bg-cyan-50', hex: '#22d3ee' },
]

function makeKey(date: string, paraNumber: number): string {
  return `${date}|${paraNumber}`
}

export const useLessonNotes = () => {
  const allNotes = ref<Record<string, LessonNote[]>>({})

  const load = () => {
    if (import.meta.server) return
    try {
      const raw = localStorage.getItem(NOTES_KEY)
      if (raw) allNotes.value = JSON.parse(raw)
    } catch {}
  }

  const save = () => {
    if (import.meta.server) return
    const entries = Object.fromEntries(
      Object.entries(allNotes.value).filter(([, v]) => v.length > 0)
    )
    if (Object.keys(entries).length === 0) {
      localStorage.removeItem(NOTES_KEY)
    } else {
      localStorage.setItem(NOTES_KEY, JSON.stringify(entries))
    }
  }

  const getNotes = (date: string, paraNumber: number): LessonNote[] => {
    return allNotes.value[makeKey(date, paraNumber)] || []
  }

  const addNote = (date: string, paraNumber: number, note: LessonNote) => {
    const key = makeKey(date, paraNumber)
    if (!allNotes.value[key]) allNotes.value[key] = []
    allNotes.value[key].push(note)
    save()
  }

  const removeNote = (date: string, paraNumber: number, index: number) => {
    const key = makeKey(date, paraNumber)
    const arr = allNotes.value[key]
    if (arr) {
      arr.splice(index, 1)
      if (arr.length === 0) delete allNotes.value[key]
      save()
    }
  }

  return { allNotes, load, getNotes, addNote, removeNote, NOTE_ICONS, NOTE_COLORS, noteColorStyle }
}
