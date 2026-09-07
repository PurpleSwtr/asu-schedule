<script setup lang="ts">
const emit = defineEmits(["toggleCalendar", "toggleSettings"])
defineProps<{ calendarOpen: boolean }>()

const { currentView, setView } = useAppView()

const menuItems = computed(() => [
  [
    {
      label: "Расписание",
      icon: "i-lucide-calendar-days",
      active: currentView.value === "schedule",
      onSelect: () => setView("schedule"),
    },
    {
      label: "Календарь заметок",
      icon: "i-lucide-file-text",
      active: currentView.value === "notes",
      onSelect: () => setView("notes"),
    },
  ],
])

const viewLabel = computed(() =>
  currentView.value === "schedule" ? "Расписание" : "Календарь заметок",
)

// One-time tooltip for the new calendar in menu
const { tooltipsEnabled } = useFirstLaunch()
const { init: initAppSettings, showTutorials } = useAppSettings()
const MENU_TOOLTIP_KEY = 'asu-menu-tooltip-seen'
const showMenuTooltip = ref(false)
const menuTooltipTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const maybeShowMenuTooltip = () => {
  if (import.meta.server) return
  if (!showTutorials.value) return
  if (localStorage.getItem(MENU_TOOLTIP_KEY)) return
  menuTooltipTimer.value = setTimeout(() => {
    showMenuTooltip.value = true
    localStorage.setItem(MENU_TOOLTIP_KEY, 'true')
  }, 1500)
}

watch([tooltipsEnabled, showTutorials], (v) => {
  if (v) maybeShowMenuTooltip()
})

onMounted(() => {
  initAppSettings()
  if (tooltipsEnabled.value) maybeShowMenuTooltip()
})

const dismissTooltip = () => {
  showMenuTooltip.value = false
}

onBeforeUnmount(() => {
  if (menuTooltipTimer.value) clearTimeout(menuTooltipTimer.value)
})
</script>

<template>
  <header class="shrink-0 border-b border-(--ui-border)">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="relative">
        <UDropdownMenu :items="menuItems" :ui="{ content: 'w-56' }">
          <UButton
            color="neutral"
            variant="ghost"
            class="group !px-1 !py-1 text-lg font-bold"
          >
            {{ viewLabel }}
            <UIcon
              name="i-lucide-chevron-down"
              class="h-5 w-5 transition-transform group-data-[state=open]:rotate-180"
            />
          </UButton>
        </UDropdownMenu>

        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="showMenuTooltip"
            class="absolute left-0 top-full mt-2 z-10 max-w-xs rounded-lg shadow-lg border border-(--ui-border) bg-(--ui-bg) p-3"
          >
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-file-text"
                class="h-5 w-5 shrink-0 text-(--ui-primary) mt-0.5"
              />
              <div class="flex-1">
                <p class="text-sm">Теперь тут есть меню!</p>
                <p class="text-sm">
                  <strong>Календарь заметок</strong> находится там.
                </p>
              </div>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="shrink-0"
                @click="dismissTooltip"
              />
            </div>
            <div
              class="absolute -top-1 left-6 h-2 w-2 rotate-45 bg-(--ui-bg) border-t border-l border-(--ui-border)"
            ></div>
          </div>
        </Transition>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <UButton
          v-if="currentView === 'schedule'"
          icon="i-lucide-calendar-days"
          color="neutral"
          :variant="calendarOpen ? 'soft' : 'ghost'"
          size="sm"
          @click="emit('toggleCalendar')"
        />
        <UButton
          icon="i-lucide-settings"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Настройки"
          @click="emit('toggleSettings')"
        />
      </div>
    </div>
  </header>
</template>