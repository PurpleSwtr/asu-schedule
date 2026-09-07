<script setup lang="ts">
import type { BadgeCategory } from "~/composables/useBadgeColors"
import { accentHex } from "~/composables/useAccentColor"

const emit = defineEmits(["update:open"])
const props = defineProps<{ open: boolean }>()

const { currentColor, availableColors, setColor } = useAccentColor()
const colorMode = useColorMode()
const { badgeColors, BADGE_CATEGORIES, setBadgeColor } = useBadgeColors()
const {
  confettiOnLaunch,
  showTutorials,
  setConfettiOnLaunch,
  setShowTutorials,
} = useAppSettings()
const { currentGroup, groups } = useSchedule()
const { fire: fireConfetti } = useConfetti()

const testConfetti = () => {
  fireConfetti({
    emojis: ["🎉", "✨", "⭐"],
    emojiCount: 8,
    emojiSize: 56,
    colorCount: 30,
  })
}

type Screen =
  | "root"
  | "personalization"
  | "theme"
  | "accent"
  | "colors"
  | "color-picker"
  | "main"
  | "groups"

const history = ref<Screen[]>(["root"])
const transitionName = ref("slide-forward")
const pickerCategory = ref<BadgeCategory | null>(null)

const screen = computed(() => history.value[history.value.length - 1])

const TITLES: Partial<Record<Screen, string>> = {
  root: "Настройки",
  personalization: "Персонализация",
  theme: "Тема",
  accent: "Акцентный цвет",
  colors: "Цвета для плашек",
  main: "Основное",
  groups: "Выбор группы",
}

const title = computed(() =>
  screen.value === "color-picker"
    ? (BADGE_CATEGORIES.find((c) => c.key === pickerCategory.value)?.label ??
      "Цвет")
    : (TITLES[screen.value] ?? "Настройки"),
)

watch(
  () => props.open,
  (v) => {
    if (v) {
      history.value = ["root"]
      pickerCategory.value = null
      transitionName.value = "slide-forward"
      containerHeight.value = "auto"
      transitioning.value = true
      nextTick(() => {
        transitioning.value = false
      })
    }
  },
)

const containerEl = ref<HTMLElement | null>(null)
const containerHeight = ref<number | "auto">("auto")
const transitioning = ref(false)

const onBeforeEnter = (el: HTMLElement) => {
  transitioning.value = false
  nextTick(() => {
    containerHeight.value = el.offsetHeight
  })
}

const navigate = (nextScreen: Screen | null, toBack: boolean) => {
  transitionName.value = toBack ? "slide-back" : "slide-forward"
  if (containerHeight.value === "auto" && containerEl.value) {
    transitioning.value = true
    containerHeight.value = containerEl.value.offsetHeight
  }
  if (toBack) {
    history.value = history.value.slice(0, -1)
  } else if (nextScreen) {
    history.value = [...history.value, nextScreen]
  }
}

const go = (next: Screen) => navigate(next, false)
const back = () => navigate(null, true)

const themeLabel = computed(() => {
  const p = colorMode.preference
  return p === "light" ? "Светлая" : p === "dark" ? "Тёмная" : "Система"
})

const currentAccent = computed(() =>
  availableColors.find((c) => c.value === currentColor.value),
)

const currentGroupName = computed(
  () => groups.value.find((g) => g.id === currentGroup.value)?.name,
)

const openColorPicker = (category: BadgeCategory) => {
  pickerCategory.value = category
  go("color-picker")
}

const pickBadgeColor = (color: string) => {
  if (pickerCategory.value) {
    setBadgeColor(pickerCategory.value, color)
    back()
  }
}

const badgeSwatchHex = (category: BadgeCategory) =>
  accentHex(badgeColors.value[category])

const themeItems = [
  { value: "light", label: "Светлая", icon: "i-lucide-sun" },
  { value: "dark", label: "Тёмная", icon: "i-lucide-moon" },
  { value: "system", label: "Система", icon: "i-lucide-monitor" },
]

const rootRows = [
  {
    key: "main" as Screen,
    label: "Основное",
    subtitle: "Группа, туториалы",
    icon: "i-lucide-sliders-horizontal",
  },
  {
    key: "personalization" as Screen,
    label: "Персонализация",
    subtitle: "Тема, акцент, цвета, конфетти",
    icon: "i-lucide-palette",
  },
]

const personalizationRows = computed(() => [
  {
    key: "theme" as Screen,
    label: "Тема",
    subtitle: themeLabel.value,
    icon: "i-lucide-moon-star",
  },
  {
    key: "accent" as Screen,
    label: "Акцентный цвет",
    subtitle: currentAccent.value?.label ?? "Зелёный",
    icon: "i-lucide-swatch-book",
    swatch: currentAccent.value?.hex,
  },
  {
    key: "colors" as Screen,
    label: "Цвета для плашек",
    subtitle: "Лабораторки, лекции, практика, недели",
    icon: "i-lucide-paint-bucket",
  },
])
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
    :ui="{ width: 'sm:max-w-md' }"
  >
    <template #content>
      <div class="p-5">
        <div class="flex items-center gap-1 mb-4">
          <UButton
            v-if="screen !== 'root'"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Назад"
            @click="back"
          />
          <h2 class="font-semibold flex-1">{{ title }}</h2>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Закрыть"
            @click="emit('update:open', false)"
          />
        </div>

        <div
          ref="containerEl"
          class="relative overflow-hidden transition-[height] duration-200 ease-out"
          :class="{ 'transition-none': transitioning }"
          :style="{
            height:
              containerHeight === 'auto' ? 'auto' : containerHeight + 'px',
          }"
        >
          <Transition :name="transitionName" @before-enter="onBeforeEnter">
            <div :key="screen" class="overflow-y-auto pr-1 space-y-1">
              <!-- ROOT -->
              <template v-if="screen === 'root'">
                <button
                  v-for="row in rootRows"
                  :key="row.key"
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented) transition-colors text-left"
                  @click="go(row.key)"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-primary-100)"
                  >
                    <UIcon
                      :name="row.icon"
                      class="h-5 w-5 text-(--ui-primary)"
                    />
                  </span>
                  <span class="flex-1 min-w-0">
                    <span class="block text-sm font-medium">{{
                      row.label
                    }}</span>
                    <span class="block text-xs text-(--ui-text-muted)">
                      {{ row.subtitle }}
                    </span>
                  </span>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="h-4 w-4 shrink-0 text-(--ui-text-muted)"
                  />
                </button>
              </template>

              <!-- PERSONALIZATION -->
              <template v-else-if="screen === 'personalization'">
                <button
                  v-for="row in personalizationRows"
                  :key="row.key"
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented) transition-colors text-left"
                  @click="go(row.key)"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-primary-100)"
                  >
                    <UIcon
                      :name="row.icon"
                      class="h-5 w-5 text-(--ui-primary)"
                    />
                  </span>
                  <span class="flex-1 min-w-0">
                    <span class="block text-sm font-medium">{{
                      row.label
                    }}</span>
                    <span class="block text-xs text-(--ui-text-muted)">
                      {{ row.subtitle }}
                    </span>
                  </span>
                  <span
                    v-if="row.swatch"
                    class="h-4 w-4 shrink-0 rounded-full"
                    :style="{ backgroundColor: row.swatch }"
                  />
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="h-4 w-4 shrink-0 text-(--ui-text-muted)"
                  />
                </button>

                <div
                  class="mt-1 flex items-center gap-3 rounded-lg px-2 py-2.5"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-primary-100)"
                  >
                    <UIcon
                      name="i-lucide-party-popper"
                      class="h-5 w-5 text-(--ui-primary)"
                    />
                  </span>
                  <span class="flex-1 min-w-0">
                    <span class="block text-sm font-medium"
                      >Конфетти при запуске</span
                    >
                  </span>
                  <UButton
                    icon="i-lucide-play"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    aria-label="Проверить конфетти"
                    @click="testConfetti"
                  />
                  <USwitch
                    :model-value="confettiOnLaunch"
                    @update:model-value="setConfettiOnLaunch($event)"
                  />
                </div>
              </template>

              <!-- THEME -->
              <template v-else-if="screen === 'theme'">
                <button
                  v-for="item in themeItems"
                  :key="item.value"
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented) transition-colors text-left"
                  @click="colorMode.preference = item.value"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-primary-100)"
                  >
                    <UIcon
                      :name="item.icon"
                      class="h-5 w-5 text-(--ui-primary)"
                    />
                  </span>
                  <span class="flex-1 text-sm font-medium">{{
                    item.label
                  }}</span>
                  <UIcon
                    v-if="colorMode.preference === item.value"
                    name="i-lucide-check"
                    class="h-4 w-4 shrink-0 text-(--ui-primary)"
                  />
                </button>
              </template>

              <!-- ACCENT -->
              <template v-else-if="screen === 'accent'">
                <div class="grid grid-cols-6 gap-3 px-2 py-2">
                  <button
                    v-for="c in availableColors"
                    :key="c.value"
                    class="relative aspect-square rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-text) focus-visible:ring-offset-1"
                    :style="{ backgroundColor: c.hex }"
                    :title="c.label"
                    @click="setColor(c.value)"
                  >
                    <UIcon
                      v-if="currentColor === c.value"
                      name="i-lucide-check"
                      class="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm"
                    />
                  </button>
                </div>
              </template>

              <!-- BADGE COLORS LIST -->
              <template v-else-if="screen === 'colors'">
                <button
                  v-for="category in BADGE_CATEGORIES"
                  :key="category.key"
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented) transition-colors text-left"
                  @click="openColorPicker(category.key)"
                >
                  <span
                    class="h-5 w-5 shrink-0 rounded-full"
                    :style="{ backgroundColor: badgeSwatchHex(category.key) }"
                  />
                  <span class="flex-1 text-sm font-medium">{{
                    category.label
                  }}</span>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="h-4 w-4 shrink-0 text-(--ui-text-muted)"
                  />
                </button>
              </template>

              <!-- BADGE COLOR PICKER -->
              <template v-else-if="screen === 'color-picker'">
                <div v-if="pickerCategory">
                  <p class="px-2 pb-3 text-xs text-(--ui-text-muted)">
                    Выберите цвет для «{{
                      BADGE_CATEGORIES.find((c) => c.key === pickerCategory)
                        ?.label
                    }}»
                  </p>
                  <div class="grid grid-cols-6 gap-3 px-2 py-2">
                    <button
                      v-for="c in availableColors"
                      :key="c.value"
                      class="relative aspect-square rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-text) focus-visible:ring-offset-1"
                      :style="{ backgroundColor: c.hex }"
                      :title="c.label"
                      @click="pickBadgeColor(c.value)"
                    >
                      <UIcon
                        v-if="badgeColors[pickerCategory] === c.value"
                        name="i-lucide-check"
                        class="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm"
                      />
                    </button>
                  </div>
                </div>
              </template>

              <!-- MAIN -->
              <template v-else-if="screen === 'main'">
                <button
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented) transition-colors text-left"
                  @click="go('groups')"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-primary-100)"
                  >
                    <UIcon
                      name="i-lucide-users"
                      class="h-5 w-5 text-(--ui-primary)"
                    />
                  </span>
                  <span class="flex-1 min-w-0">
                    <span class="block text-sm font-medium">Выбор группы</span>
                    <span class="block text-xs text-(--ui-text-muted)">
                      {{ currentGroupName ?? "Выберите группу" }}
                    </span>
                  </span>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="h-4 w-4 shrink-0 text-(--ui-text-muted)"
                  />
                </button>

                <div class="flex items-center gap-3 rounded-lg px-2 py-2.5">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-primary-100)"
                  >
                    <UIcon
                      name="i-lucide-graduation-cap"
                      class="h-5 w-5 text-(--ui-primary)"
                    />
                  </span>
                  <span class="flex-1 min-w-0">
                    <span class="block text-sm font-medium">
                      Показывать Туториалы с обновлениями / изменениями
                    </span>
                  </span>
                  <USwitch
                    :model-value="showTutorials"
                    @update:model-value="setShowTutorials($event)"
                  />
                </div>
              </template>

              <!-- GROUPS -->
              <template v-else-if="screen === 'groups'">
                <div class="px-1 py-2">
                  <GroupSelector />
                </div>
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.slide-forward-enter-from {
  transform: translateX(60px);
  opacity: 0;
}
.slide-forward-leave-to {
  transform: translateX(-60px);
  opacity: 0;
}

.slide-back-enter-from {
  transform: translateX(-60px);
  opacity: 0;
}
.slide-back-leave-to {
  transform: translateX(60px);
  opacity: 0;
}

.slide-forward-enter-active,
.slide-back-enter-active {
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.slide-forward-leave-active,
.slide-back-leave-active {
  position: absolute;
  width: 100%;
  pointer-events: none;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}
</style>
