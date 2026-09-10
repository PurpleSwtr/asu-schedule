import type { Lesson } from "~/composables/useSchedule"
import type { LessonNote } from "~/composables/useLessonNotes"

export interface NoteEntry {
  date: string
  para: number
  note: LessonNote
  lesson: Lesson | null
  dateSort: number
}

function monthDayNum(dateKey: string): number {
  const [dd, mm] = dateKey.split(".").map(Number)
  return (mm || 0) * 100 + (dd || 0)
}

export const useNoteSubjects = () => {
  const { allNotes } = useLessonNotes()
  const { currentGroup, groupDays, days, noteDateMeta, isVisibleInWeek } =
    useSchedule()

  const dayIndex = (day: string) => days.value.indexOf(day)

  const dateSortKey = (dateKey: string): number => {
    const meta = noteDateMeta[dateKey]
    if (meta) return meta.week * 1000 + dayIndex(meta.day) * 10
    return 99999 + monthDayNum(dateKey)
  }

  const subjectsOrder = computed<Record<string, number>>(() => {
    const order: Record<string, number> = {}
    if (!groupDays.value) return order
    let idx = 0
    for (const dayName of days.value) {
      const lessons = [...(groupDays.value[dayName] || [])]
      lessons.sort((a, b) => a.paraNumber - b.paraNumber)
      for (const l of lessons) {
        if (!(l.subject in order)) order[l.subject] = idx++
      }
    }
    return order
  })

  const grouped = computed(() => {
    const subjects: {
      subject: string
      notes: NoteEntry[]
    }[] = []
    const dayNotes: NoteEntry[] = []
    const other: NoteEntry[] = []
    const subjectMap = new Map<string, NoteEntry[]>()

    for (const [key, notes] of Object.entries(allNotes.value)) {
      const [date, paraStr] = key.split("|")
      const para = Number(paraStr) || 0

      for (const note of notes) {
        let lesson: Lesson | null = null
        const meta = noteDateMeta[date]

        if (para === 0) {
          dayNotes.push({
            date,
            para,
            note,
            lesson: null,
            dateSort: dateSortKey(date),
          })
          continue
        }

        if (meta && groupDays.value) {
          const dayLessons = groupDays.value[meta.day] || []
          lesson =
            dayLessons.find(
              (l) =>
                l.paraNumber === para &&
                isVisibleInWeek(l, meta.week, meta.type),
            ) ||
            dayLessons.find((l) => l.paraNumber === para) ||
            null
        }

        if (lesson) {
          const list = subjectMap.get(lesson.subject)
          if (list) {
            list.push({
              date,
              para,
              note,
              lesson,
              dateSort: meta ? dateSortKey(date) * 10 + para : 99999 + para,
            })
          } else {
            const arr = [
              {
                date,
                para,
                note,
                lesson,
                dateSort: meta ? dateSortKey(date) * 10 + para : 99999 + para,
              },
            ]
            subjectMap.set(lesson.subject, arr)
            subjects.push({ subject: lesson.subject, notes: arr })
          }
        } else {
          other.push({
            date,
            para,
            note,
            lesson: null,
            dateSort: 99999 + monthDayNum(date) * 10 + para,
          })
        }
      }
    }

    subjects.sort(
      (a, b) => (subjectsOrder.value[a.subject] ?? 999) - (subjectsOrder.value[b.subject] ?? 999),
    )
    for (const s of subjects) {
      s.notes.sort((a, b) => a.dateSort - b.dateSort)
    }
    dayNotes.sort((a, b) => a.dateSort - b.dateSort)
    other.sort((a, b) => a.dateSort - b.dateSort)

    return { subjects, dayNotes, other }
  })

  const total = computed(() =>
    Object.values(allNotes.value).reduce(
      (acc, arr) => acc + (arr?.length || 0),
      0,
    ),
  )

  return { currentGroup, grouped, total }
}