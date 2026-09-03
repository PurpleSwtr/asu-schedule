<script setup lang="ts">
import type { Lesson } from "~/composables/useSchedule"
import type { LessonNote } from "~/composables/useLessonNotes"
import { DAY_NOTE_PARA, noteColorStyle } from "~/composables/useLessonNotes"
import { Swiper, SwiperSlide } from "swiper/vue"
import "swiper/css"

const scheduleSwiper = ref<any>(null)

const { currentView } = useAppView()

const {
  isLoading,
  error,
  currentWeek,
  currentDay,
  currentWeekData,
  daySchedule,
  getDaySlots,
  weekDaysWithDates,
  getWeekTypeLabel,
  loadSchedule,
  setWeek,
  setDay,
  days,
} = useSchedule()

const { load: loadNotes, getNotes, addNote, removeNote } = useLessonNotes()

onMounted(async () => {
  await Promise.all([loadSchedule(), loadNotes()])
})

const handleWeekChange = () => {
  setWeek(currentWeek.value)
}

const calendarOpen = ref(false)

const notesOpen = ref(false)
const activeLesson = ref<Lesson | null>(null)
const activeDate = ref("")
const activePara = ref<number | null>(null)
const activeNotes = ref<LessonNote[]>([])

const openNotes = (lesson: Lesson, date: string) => {
  activeLesson.value = lesson
  activeDate.value = date
  activePara.value = lesson.paraNumber
  activeNotes.value = getNotes(date, lesson.paraNumber)
  notesOpen.value = true
}

const openDayNotes = (date: string) => {
  activeLesson.value = null
  activeDate.value = date
  activePara.value = DAY_NOTE_PARA
  activeNotes.value = getNotes(date, DAY_NOTE_PARA)
  notesOpen.value = true
}

const dayNotes = (date: string) => getNotes(date, DAY_NOTE_PARA)

const refreshNotes = () => {
  if (activePara.value === null) return
  activeNotes.value = getNotes(activeDate.value, activePara.value)
}

const handleAddNote = (note: LessonNote) => {
  if (activePara.value === null) return
  addNote(activeDate.value, activePara.value, note)
  refreshNotes()
}

const handleRemoveNote = (index: number) => {
  if (activePara.value === null) return
  removeNote(activeDate.value, activePara.value, index)
  refreshNotes()
}

// One-time tooltip near the "+" on the first lesson
const { tooltipsEnabled } = useFirstLaunch()
const NOTES_HINT_KEY = "asu-notes-hint-seen"
const showNotesHint = ref(false)
const notesHintTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const hasLessons = computed(() => daySchedule.value.some((s) => "subject" in s))

const maybeShowNotesHint = () => {
  if (import.meta.server) return
  if (localStorage.getItem(NOTES_HINT_KEY)) return
  notesHintTimer.value = setTimeout(() => {
    showNotesHint.value = true
    localStorage.setItem(NOTES_HINT_KEY, "true")
  }, 2000)
}

watch(tooltipsEnabled, (v) => {
  if (v) maybeShowNotesHint()
})

onMounted(() => {
  if (tooltipsEnabled.value) maybeShowNotesHint()
})

watch(hasLessons, (v) => {
  if (!v) showNotesHint.value = false
})

onBeforeUnmount(() => {
  if (notesHintTimer.value) clearTimeout(notesHintTimer.value)
})

const dismissNotesHint = () => {
  showNotesHint.value = false
}

const DAY_TABS = days.value

const scheduleSlides = computed(() =>
  weekDaysWithDates.value.map((d) => ({
    name: d.name,
    date: d.date,
    slots: getDaySlots(d.name),
  })),
)

const selectedIndex = computed(() => {
  const idx = DAY_TABS.indexOf(currentDay.value)
  return idx >= 0 ? idx : 0
})

const onSwiper = (swiper: any) => {
  scheduleSwiper.value = swiper
}

let lastRealIndex: number | null = null
let programmaticNav = false

const onSlideChange = (swiper: any) => {
  const cur = swiper.realIndex ?? swiper.activeIndex
  const day = DAY_TABS[cur]
  if (!day) return

  if (programmaticNav) {
    programmaticNav = false
    lastRealIndex = cur
    setDay(day)
    return
  }

  if (lastRealIndex !== null) {
    // Sunday (6) -> Monday (0): advance to next week
    if (lastRealIndex === 6 && cur === 0) {
      setWeek(currentWeek.value + 1)
      lastRealIndex = cur
      scheduleSwiper.value?.update()
      return
    }
    // Monday (0) -> Sunday (6): go back to previous week
    if (lastRealIndex === 0 && cur === 6) {
      setWeek(currentWeek.value - 1)
      lastRealIndex = cur
      scheduleSwiper.value?.update()
      return
    }
  }

  lastRealIndex = cur
  setDay(day)
}

watch(
  selectedIndex,
  (idx) => {
    const s = scheduleSwiper.value
    if (!s) return
    const real = s.realIndex ?? s.activeIndex
    if (real !== idx) {
      programmaticNav = true
      if (typeof s.slideToLoop === "function") {
        s.slideToLoop(idx, 300)
      } else {
        s.slideTo(idx, 300)
      }
    }
  },
  { flush: "post" },
)
</script>

<template>
  <div class="h-dvh flex flex-col overflow-hidden">
    <AppHeader
      :calendar-open="calendarOpen"
      @toggle-calendar="calendarOpen = !calendarOpen"
    />

    <NotesCalendar v-if="currentView === 'notes'" class="flex-1 min-h-0" />

    <template v-else>
      <template v-if="isLoading || error">
        <div class="flex-1 flex items-center justify-center px-4">
          <UCard v-if="isLoading" class="text-center py-10 w-full max-w-sm">
            <UIcon
              name="i-lucide-loader-circle"
              class="mx-auto mb-3 h-8 w-8 animate-spin text-(--ui-primary)"
            />
            <p>Загрузка расписания…</p>
          </UCard>
          <UCard v-else-if="error" class="text-center py-10 w-full max-w-sm">
            <p class="text-(--ui-error)">{{ error }}</p>
          </UCard>
        </div>
      </template>

      <template v-else>
        <Transition
          appear
          enter-active-class="transition ease-out duration-500"
          enter-from-class="opacity-0 translate-y-3"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div
            class="flex-1 min-h-0 flex flex-col lg:justify-center lg:items-center"
          >
          <div
            class="w-full lg:max-w-3xl flex flex-col min-h-0 lg:min-h-0 lg:max-h-[92dvh]"
          >
            <div class="shrink-0 space-y-3 px-4 pt-4 pb-3">
              <WeekSelector class="w-full" @change="handleWeekChange" />

              <div
                v-if="currentWeekData"
                class="flex items-center justify-center gap-2 flex-wrap"
              >
                <UBadge
                  :color="
                    currentWeekData.type === 'numerator'
                      ? 'primary'
                      : 'secondary'
                  "
                  variant="soft"
                >
                  {{ currentWeekData.number }}-я ·
                  {{ getWeekTypeLabel(currentWeekData.type) }}
                </UBadge>
                <span
                  v-if="currentWeekData.dates"
                  class="text-xs text-(--ui-text-muted)"
                >
                  {{ currentWeekData.dates }}
                </span>
              </div>

              <DayTabs />
            </div>

            <div class="flex-1 min-h-0 relative">
              <Swiper
                :modules="[]"
                :slides-per-view="1"
                :initial-slide="selectedIndex"
                :speed="300"
                :auto-height="false"
                :loop="true"
                class="h-full"
                @swiper="onSwiper"
                @slide-change="onSlideChange"
              >
                <SwiperSlide
                  v-for="slide in scheduleSlides"
                  :key="slide.name"
                  class="h-full"
                >
                  <div class="h-full overflow-y-auto px-4 pt-1 pb-6">
                    <div class="space-y-3 max-w-3xl mx-auto pb-2">
                      <template v-if="slide.slots.length > 0">
                        <template
                          v-for="slot in slide.slots"
                          :key="
                            'break' in slot && slot.type === 'break'
                              ? `break-${slot.fromPara}-${slot.toPara}`
                              : `lesson-${'paraNumber' in slot ? slot.paraNumber : 0}`
                          "
                        >
                          <LessonCard
                            v-if="'subject' in slot"
                            :lesson="slot"
                            :date="slide.date"
                            :notes="getNotes(slide.date, slot.paraNumber)"
                            @open-notes="openNotes(slot, slide.date)"
                          />
                          <BreakCard v-else :slot="slot" />
                        </template>
                      </template>
                      <UCard
                        v-else-if="slide.name === 'Воскресенье'"
                        class="relative py-6 pt-10 text-center"
                      >
                        <UButton
                          icon="i-lucide-plus"
                          color="neutral"
                          variant="outline"
                          size="sm"
                          class="absolute top-2 right-2"
                          @click="openDayNotes(slide.date)"
                        />
                        <div
                          class="mx-auto mb-3 flex items-center justify-center h-14 w-14 rounded-full bg-(--ui-primary-100)"
                        >
                          <UIcon
                            name="i-lucide-party-popper"
                            class="h-7 w-7 text-(--ui-primary)"
                          />
                        </div>
                        <p class="text-lg font-semibold text-(--ui-text)">
                          Выходной!
                        </p>
                        <p class="text-sm text-(--ui-text-muted) mt-1">
                          Отдыхайте и набирайтесь сил.
                        </p>

                        <p class="text-xs text-(--ui-text-muted) mt-5">
                          ( А то сессия скоро, так-то )
                        </p>

                        <div
                          v-if="dayNotes(slide.date).length"
                          class="mt-4 space-y-2 text-left max-w-md mx-auto"
                        >
                          <div
                            v-for="(n, ni) in dayNotes(slide.date)"
                            :key="ni"
                            class="flex items-start gap-2 border rounded-lg px-3 py-2"
                            :style="noteColorStyle(n.color)"
                          >
                            <UIcon
                              :name="n.icon"
                              class="h-4 w-4 shrink-0 mt-0.5 text-(--ui-text-muted)"
                            />
                            <p
                              class="text-sm flex-1 break-words whitespace-pre-wrap"
                            >
                              {{ n.text }}
                            </p>
                          </div>
                        </div>
                      </UCard>
                      <UCard v-else class="relative py-8 pt-10 text-center">
                        <UButton
                          icon="i-lucide-plus"
                          color="neutral"
                          variant="outline"
                          size="sm"
                          class="absolute top-2 right-2"
                          @click="openDayNotes(slide.date)"
                        />
                        <UIcon
                          name="i-lucide-calendar-x"
                          class="mx-auto mb-2 h-6 w-6 text-(--ui-text-muted)"
                        />
                        <p class="text-(--ui-text-muted)">
                          В этот день пар нет
                        </p>
                        <div
                          v-if="dayNotes(slide.date).length"
                          class="mt-4 space-y-2 text-left max-w-md mx-auto"
                        >
                          <div
                            v-for="(n, ni) in dayNotes(slide.date)"
                            :key="ni"
                            class="flex items-start gap-2 border rounded-lg px-3 py-2"
                            :style="noteColorStyle(n.color)"
                          >
                            <UIcon
                              :name="n.icon"
                              class="h-4 w-4 shrink-0 mt-0.5 text-(--ui-text-muted)"
                            />
                            <p
                              class="text-sm flex-1 break-words whitespace-pre-wrap"
                            >
                              {{ n.text }}
                            </p>
                          </div>
                        </div>
                      </UCard>
                    </div>
                  </div>
                </SwiperSlide>
              </Swiper>
              <Transition
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-1"
              >
                <div
                  v-if="showNotesHint && hasLessons"
                  class="absolute top-1 right-1 z-10 max-w-xs rounded-lg shadow-lg border border-(--ui-border) bg-(--ui-bg) p-3"
                >
                  <div class="flex items-start gap-2">
                    <UIcon
                      name="i-lucide-plus"
                      class="h-5 w-5 shrink-0 text-(--ui-primary) mt-0.5"
                    />
                    <div class="flex-1">
                      <p class="text-sm">
                        Нажмите на <strong>+</strong> в правом верхнем углу,
                        чтобы добавить заметки.
                      </p>
                    </div>
                    <UButton
                      icon="i-lucide-x"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      class="shrink-0"
                      @click="dismissNotesHint"
                    />
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
        </Transition>
      </template>
    </template>

    <UModal v-model:open="calendarOpen">
      <template #content>
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="font-semibold">Просмотр по дате</span>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="calendarOpen = false"
            />
          </div>
          <ScheduleCalendar />
          <p class="mt-3 text-center text-xs text-(--ui-text-muted)">
            Выберите дату, чтобы перейти к нужной неделе и дню.
          </p>
        </div>
      </template>
    </UModal>

    <LessonNotesModal
      :lesson="activeLesson"
      :date="activeDate"
      :notes="activeNotes"
      :open="notesOpen"
      @update:open="notesOpen = $event"
      @add="handleAddNote"
      @remove="handleRemoveNote"
    />
  </div>
</template>
