<script setup lang="ts">
import type { Lesson } from "~/composables/useSchedule"
import type { LessonNote } from "~/composables/useLessonNotes"
import { DAY_NOTE_PARA } from "~/composables/useLessonNotes"
import { Swiper, SwiperSlide } from "swiper/vue"
import "swiper/css"

const scheduleSwiper = ref<any>(null)

const { currentView } = useAppView()

const VIEW_ORDER: Record<string, number> = {
  schedule: 0,
  notes: 1,
  allNotes: 2,
}
const viewDirection = ref(1)
watch(currentView, (nv, ov) => {
  viewDirection.value =
    (VIEW_ORDER[nv] ?? 0) >= (VIEW_ORDER[ov] ?? 0) ? 1 : -1
})

const viewVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? 32 : -32,
    scale: 0.97,
  }),
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 26 },
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? -24 : 24,
    scale: 0.98,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  }),
}

const {
  isLoading,
  error,
  currentWeek,
  currentDay,
  daySchedule,
  getDaySlots,
  weekDaysWithDates,
  loadSchedule,
  setWeek,
  setDay,
  days,
} = useSchedule()

const weekDirection = ref(1)
watch(currentWeek, (nv, ov) => {
  weekDirection.value = nv >= ov ? 1 : -1
})

const {
  load: loadNotes,
  getNotes,
  addNote,
  updateNote,
  removeNote,
} = useLessonNotes()

onMounted(async () => {
  await Promise.all([loadSchedule(), loadNotes()])
})

const handleWeekChange = () => {
  setWeek(currentWeek.value)
}

const calendarOpen = ref(false)
const settingsOpen = ref(false)

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

const openNotesForDate = (date: string, para: number) => {
  activeLesson.value = null
  activeDate.value = date
  activePara.value = para
  activeNotes.value = getNotes(date, para)
  notesOpen.value = true
}

const refreshNotes = () => {
  if (activePara.value === null) return
  activeNotes.value = getNotes(activeDate.value, activePara.value)
}

const handleAddNote = (note: LessonNote) => {
  if (activePara.value === null) return
  addNote(activeDate.value, activePara.value, note)
  refreshNotes()
}

const handleUpdateNote = (index: number, note: LessonNote) => {
  if (activePara.value === null) return
  updateNote(activeDate.value, activePara.value, index, note)
  refreshNotes()
}

const handleRemoveNote = (index: number) => {
  if (activePara.value === null) return
  removeNote(activeDate.value, activePara.value, index)
  refreshNotes()
}

// One-time tooltip near the "+" on the first lesson
const { tooltipsEnabled } = useFirstLaunch()
const { init: initAppSettings, showTutorials } = useAppSettings()
const NOTES_HINT_KEY = "asu-notes-hint-seen"
const showNotesHint = ref(false)
const notesHintTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const hasLessons = computed(() => daySchedule.value.some((s) => "subject" in s))

const maybeShowNotesHint = () => {
  if (import.meta.server) return
  if (!showTutorials.value) return
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
  initAppSettings()
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
      setDay(day)
      lastRealIndex = cur
      scheduleSwiper.value?.update()
      return
    }
    // Monday (0) -> Sunday (6): go back to previous week
    if (lastRealIndex === 0 && cur === 6) {
      setWeek(currentWeek.value - 1)
      setDay(day)
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
      @toggle-settings="settingsOpen = true"
    />

    <AnimatePresence
      mode="wait"
      :initial="false"
      :custom="viewDirection"
    >
      <Motion
        :key="currentView"
        class="flex-1 min-h-0 flex flex-col"
        :custom="viewDirection"
        :variants="viewVariants"
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <NotesCalendar
          v-if="currentView === 'notes'"
          class="flex-1 min-h-0"
          @open="openNotesForDate"
        />

        <NotesBySubject
          v-else-if="currentView === 'allNotes'"
          class="flex-1 min-h-0"
        />

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
                <WeekSelector @change="handleWeekChange" />

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
                    v-for="(slide, slideIndex) in scheduleSlides"
                    :key="slide.name"
                    class="h-full"
                  >
                    <div class="h-full overflow-y-auto px-4 pt-1 pb-6">
                      <div
                        :key="slide.date"
                        class="space-y-3 max-w-3xl mx-auto pb-2"
                      >
                        <template v-if="slide.slots.length > 0">
                          <template
                            v-for="(slot, si) in slide.slots"
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
                              :index="si"
                              :direction="weekDirection"
                              :active="slideIndex === selectedIndex"
                              @open-notes="openNotes(slot, slide.date)"
                            />
                            <BreakCard
                              v-else
                              :slot="slot"
                              :index="si"
                              :direction="weekDirection"
                              :active="slideIndex === selectedIndex"
                            />
                          </template>
                        </template>
                        <DayEmptyCard
                          v-else-if="slide.name === 'Воскресенье'"
                          variant="weekend"
                          :active="slideIndex === selectedIndex"
                        />
                        <DayEmptyCard
                          v-else
                          :active="slideIndex === selectedIndex"
                        />

<NoteBlock
                        v-for="(n, ni) in dayNotes(slide.date)"
                        :key="`day-note-${ni}`"
                        :note="n"
                        class="cursor-pointer"
                        @click="openDayNotes(slide.date)"
                      />

                        <UButton
                          icon="i-lucide-plus"
                          color="neutral"
                          variant="outline"
                          class="w-full py-4 justify-center"
                          @click="openDayNotes(slide.date)"
                        >
                          Добавить
                        </UButton>
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
      </Motion>
    </AnimatePresence>

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

    <SettingsModal :open="settingsOpen" @update:open="settingsOpen = $event" />

    <LessonNotesModal
      :lesson="activeLesson"
      :date="activeDate"
      :notes="activeNotes"
      :open="notesOpen"
      @update:open="notesOpen = $event"
      @add="handleAddNote"
      @update="handleUpdateNote"
      @remove="handleRemoveNote"
    />
  </div>
</template>
