<script setup lang="ts">
import { computed, ref } from "vue"
import { noteColorStyle } from "~/composables/useLessonNotes"
import type { LessonNote } from "~/composables/useLessonNotes"

const { allNotes, load: loadNotes } = useLessonNotes()

const emit = defineEmits<{
  (e: "open", date: string, para: number): void
}>()

const { groupDays, noteDateMeta, isVisibleInWeek } = useSchedule()

onMounted(() => {
  loadNotes()
})

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

const viewDate = ref(new Date())
const selectedKey = ref("")

const dayNotesCount = (key: string): number => {
  let total = 0
  for (const k of Object.keys(allNotes.value)) {
    if (k.startsWith(key + "|")) {
      total += allNotes.value[k]?.length || 0
    }
  }
  return total
}

const dayNotesList = (key: string): { note: LessonNote; para: number }[] => {
  const result: { note: LessonNote; para: number }[] = []
  for (const k of Object.keys(allNotes.value)) {
    if (!k.startsWith(key + "|")) continue
    const para = Number(k.split("|")[1]) || 0
    for (const n of allNotes.value[k] || []) {
      result.push({ note: n, para })
    }
  }
  return result.sort((a, b) => a.para - b.para)
}

const noteSubject = (date: string, para: number): string | null => {
  if (para === 0) return null
  const meta = noteDateMeta[date]
  if (meta && groupDays.value) {
    const dayLessons = groupDays.value[meta.day] || []
    const lesson =
      dayLessons.find(
        (l) =>
          l.paraNumber === para && isVisibleInWeek(l, meta.week, meta.type),
      ) ||
      dayLessons.find((l) => l.paraNumber === para) ||
      null
    return lesson ? lesson.subject : null
  }
  return null
}

const noteMeta = (date: string, para: number): string => {
  if (para === 0) return "Заметка на день"
  return noteSubject(date, para) || `${para} пара`
}

const monthLabel = computed(() => {
  const caps = viewDate.value.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  })
  return caps.charAt(0).toUpperCase() + caps.slice(1)
})

const monthMatrix = computed<{ date: Date; key: string }[][]>(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (first.getDay() + 6) % 7

  const cells: { date: Date; key: string }[] = []
  for (let i = 0; i < startOffset; i++) {
    cells.push(null as unknown as { date: Date; key: string })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dd = String(d).padStart(2, "0")
    const mm = String(month + 1).padStart(2, "0")
    cells.push({ date, key: `${dd}.${mm}` })
  }
  while (cells.length % 7 !== 0) {
    cells.push(null as unknown as { date: Date; key: string })
  }

  const rows: { date: Date; key: string }[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }
  return rows
})

const prevMonth = () => {
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() - 1,
    1,
  )
  selectedKey.value = ""
}

const nextMonth = () => {
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() + 1,
    1,
  )
  selectedKey.value = ""
}

const isToday = (date: Date) => {
  const t = new Date()
  return (
    date.getDate() === t.getDate() &&
    date.getMonth() === t.getMonth() &&
    date.getFullYear() === t.getFullYear()
  )
}

const selectDay = (cell: { date: Date; key: string }) => {
  if (dayNotesCount(cell.key) === 0) return
  selectedKey.value = selectedKey.value === cell.key ? "" : cell.key
}
</script>

<template>
  <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-3">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="prevMonth"
        />
        <span class="font-semibold">{{ monthLabel }}</span>
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="nextMonth"
        />
      </div>

      <div class="grid grid-cols-7 gap-1 mb-1">
        <div
          v-for="wd in WEEKDAYS"
          :key="wd"
          class="text-center text-xs text-(--ui-text-muted) py-1"
        >
          {{ wd }}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <template v-for="(row, ri) in monthMatrix" :key="ri">
          <div
            v-for="(cell, ci) in row"
            :key="ci"
            class="aspect-square min-h-0"
          >
            <template v-if="cell">
              <button
                class="relative w-full h-full flex flex-col items-center justify-center rounded-lg text-sm transition-colors"
                :class="[
                  isToday(cell.date) ? 'bg-(--ui-color-primary-50)' : '',
                  dayNotesCount(cell.key) > 0
                    ? 'hover:bg-(--ui-bg-elevated)'
                    : '',
                  selectedKey === cell.key ? 'bg-(--ui-color-primary-100)' : '',
                  dayNotesCount(cell.key) === 0 && !isToday(cell.date)
                    ? 'text-(--ui-text-muted)'
                    : '',
                ]"
                @click="selectDay(cell)"
              >
                <span
                  :class="[
                    selectedKey === cell.key ||
                    (isToday(cell.date) && selectedKey !== cell.key)
                      ? 'font-bold text-(--ui-primary)'
                      : '',
                  ]"
                >
                  {{ cell.date.getDate() }}
                </span>
                <div
                  v-if="dayNotesCount(cell.key) > 0"
                  class="flex flex-wrap items-center justify-center gap-0.5 mt-1 max-w-full overflow-hidden"
                >
                  <span
                    v-for="n in dayNotesList(cell.key)"
                    :key="n.note.text"
                    class="h-1.5 w-1.5 rounded-full"
                    :style="{
                      backgroundColor: noteColorStyle(n.note.color).borderColor,
                    }"
                  />
                </div>
              </button>
            </template>
          </div>
        </template>
      </div>

      <div
        v-if="selectedKey"
        class="mt-4 border-t border-(--ui-border) pt-4 space-y-3"
      >
        <p class="text-sm font-semibold">Заметки на {{ selectedKey }}</p>
        <NoteBlock
          v-for="(item, i) in dayNotesList(selectedKey)"
          :key="i"
          :note="item.note"
          :meta="noteMeta(selectedKey, item.para)"
          truncate-meta
          @click="emit('open', selectedKey, item.para)"
        />
      </div>

      <div
        v-else-if="Object.keys(allNotes).length === 0"
        class="mt-8 text-center"
      >
        <UIcon
          name="i-lucide-sticky-note"
          class="h-10 w-10 text-(--ui-text-muted) mb-2"
        />
        <p class="text-sm text-(--ui-text-muted)">Пока нет ни одной заметки</p>
      </div>
    </div>
  </div>
</template>
