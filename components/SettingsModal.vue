<script setup lang="ts">
import type { BadgeCategory } from "~/composables/useBadgeColors"
import { accentHex } from "~/composables/useAccentColor"
import avatar from "~/assets/avatar.webp"

const emit = defineEmits(["update:open"])
const props = defineProps<{ open: boolean }>()

const {
  currentColor,
  customHex,
  chipStyle,
  availableColors,
  setColor,
  setChipStyle,
} = useAccentColor()
const {
  RADIUS_OPTIONS,
  DARK_VARIANTS,
  TEXT_SCALES,
  DENSITY_OPTIONS,
  radius,
  darkVariant,
  textScale,
  density,
  setRadius,
  setDarkVariant,
  setTextScale,
  setDensity,
} = useUiCustomization()
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
const toast = useToast()

const handleSetShowTutorials = (v: boolean) => {
  setShowTutorials(v)
  if (!v) {
    toast.add({
      icon: "i-lucide-heart-crack",
      color: "info",
      title: "Уведомления об обновлениях не будут приходить",
      description: "Грустно… Ведь они специально делаются для вас!",
      duration: 9000,
    })
  }
}

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
  | "feedback"
  | "history"
  | "backup"
  | "ui-radius"
  | "dark-variant"
  | "text-scale"
  | "density"
  | "chip-style"

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
  feedback: "Обратная связь",
  history: "История изменений",
  backup: "Перенос данных",
  "ui-radius": "Скругление элементов",
  "dark-variant": "Вариант тёмной темы",
  "text-scale": "Масштаб текста",
  density: "Плотность интерфейса",
  "chip-style": "Подложки чипов",
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
    const natural = el.offsetHeight
    const cap = Math.max(160, window.innerHeight - 96)
    if (natural > cap) {
      el.style.height = "100%"
      containerHeight.value = cap
    } else {
      el.style.height = ""
      containerHeight.value = natural
    }
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

const customDraft = ref<string>("#16a34a")

const parseHex = (hex: string) => {
  let h = hex.replace("#", "")
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  const int = parseInt(h, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

const lightWarned = ref(false)
const darkWarned = ref(false)

const onCustomColor = (value: string) => {
  customDraft.value = value
  setColor(value)
  const { r, g, b } = parseHex(value)
  const avg = (r + g + b) / 3
  if (avg > 210) {
    if (!lightWarned.value) {
      lightWarned.value = true
      darkWarned.value = false
      toast.add({
        icon: "i-lucide-sun",
        color: "warning",
        title: "Слишком светлый цвет",
        description: "Текст и чипы на таком фоне могут терять читаемость",
        duration: 6000,
      })
    }
  } else if (avg < 45) {
    if (!darkWarned.value) {
      darkWarned.value = true
      lightWarned.value = false
      toast.add({
        icon: "i-lucide-moon",
        color: "warning",
        title: "Слишком тёмный цвет",
        description: "Текст и чипы на таком фоне могут терять читаемость",
        duration: 6000,
      })
    }
  } else {
    lightWarned.value = false
    darkWarned.value = false
  }
}

const syncCustomDraft = () => {
  customDraft.value =
    customHex.value ??
    (currentColor.value === "custom" ? accentHex("custom") : "#16a34a")
  lightWarned.value = false
  darkWarned.value = false
}

const go = (next: Screen) => {
  if (next === "accent") syncCustomDraft()
  navigate(next, false)
}
const back = () => navigate(null, true)

const themeLabel = computed(() => {
  const p = colorMode.preference
  return p === "light" ? "Светлая" : p === "dark" ? "Тёмная" : "Система"
})

const isLightTheme = computed(() => colorMode.preference === "light")

const currentAccent = computed(() =>
  currentColor.value === "custom"
    ? {
        value: "custom",
        label: "Свой цвет",
        hex: customHex.value ?? accentHex("custom"),
      }
    : availableColors.find((c) => c.value === currentColor.value),
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
    subtitle: "Тема, акцент, цвета, эффекты",
    icon: "i-lucide-palette",
  },
  {
    key: "backup" as Screen,
    label: "Перенос данных",
    subtitle: "Резервная копия, импорт / экспорт",
    icon: "i-lucide-database-backup",
  },
  {
    key: "history" as Screen,
    label: "История изменений",
    subtitle: "Что уже появилось",
    icon: "i-lucide-history",
  },
  {
    key: "feedback" as Screen,
    label: "Обратная связь",
    subtitle: "Фидбек, контакты автора",
    icon: "i-lucide-heart-handshake",
  },
]

const CHIP_STYLE_LABELS: Record<string, string> = {
  pastel: "Пастельные",
  tonal: "Тональные",
  transparent: "Прозрачные",
}

const personalizationRows = computed(() => [
  {
    key: "accent" as Screen,
    label: "Акцентный цвет",
    subtitle: currentAccent.value?.label ?? "Зелёный",
    icon: "i-lucide-swatch-book",
    swatch: currentAccent.value?.hex,
  },
  {
    key: "chip-style" as Screen,
    label: "Подложки чипов",
    subtitle: CHIP_STYLE_LABELS[chipStyle.value] ?? "Пастельные",
    icon: "i-lucide-brush",
    swatch:
      chipStyle.value === "tonal"
        ? `color-mix(in srgb, ${accentHex(currentColor.value)} 32%, transparent)`
        : chipStyle.value === "transparent"
          ? "transparent"
          : accentHex(currentColor.value, 100),
  },
  {
    key: "theme" as Screen,
    label: "Тема",
    subtitle: themeLabel.value,
    icon: "i-lucide-moon-star",
  },
  {
    key: "dark-variant" as Screen,
    label: "Вариант тёмной темы",
    subtitle: isLightTheme.value
      ? "Доступно только в тёмной теме"
      : (DARK_VARIANTS.find((o) => o.value === darkVariant.value)?.label ??
        "Классический"),
    icon: "i-lucide-moon",
    disabled: isLightTheme.value,
  },
  {
    key: "colors" as Screen,
    label: "Цвета для плашек",
    subtitle: "Лабораторки, лекции, практика, недели",
    icon: "i-lucide-paint-bucket",
  },
  {
    key: "ui-radius" as Screen,
    label: "Скругление элементов",
    subtitle:
      RADIUS_OPTIONS.find((o) => o.value === radius.value)?.label ?? "Обычное",
    icon: "i-lucide-circle-dot",
  },

  {
    key: "text-scale" as Screen,
    label: "Масштаб текста",
    subtitle:
      TEXT_SCALES.find((o) => o.value === textScale.value)?.label ?? "Обычный",
    icon: "i-lucide-type",
  },
  {
    key: "density" as Screen,
    label: "Плотность интерфейса",
    subtitle:
      DENSITY_OPTIONS.find((o) => o.value === density.value)?.label ??
      "Обычная",
    icon: "i-lucide-align-justify",
  },
])

const { all: allAnnouncements } = useAnnouncements()
const historyList = computed(() => [...allAnnouncements].reverse())

const backupInput = ref<HTMLInputElement | null>(null)

const exportAllData = () => {
  if (import.meta.server) return
  try {
    const data: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key !== null) {
        data[key] = localStorage.getItem(key) || ""
      }
    }
    const payload = {
      app: "asu-schedule",
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `asu-schedule-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.add({
      icon: "i-lucide-check",
      color: "success",
      title: "Резервная копия скачана",
      description: "Файл сохранён. Переносите его на другие устройства",
    })
  } catch (e) {
    console.error("Export failed:", e)
    toast.add({
      icon: "i-lucide-triangle-alert",
      color: "error",
      title: "Не удалось создать копию",
      duration: 5000,
    })
  }
}

const triggerImport = () => {
  backupInput.value?.click()
}

const handleImportFile = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ""
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result))
      if (
        !parsed ||
        parsed.app !== "asu-schedule" ||
        typeof parsed.data !== "object" ||
        parsed.data === null
      ) {
        throw new Error("unrecognized backup file")
      }
      for (const [key, value] of Object.entries(
        parsed.data as Record<string, unknown>,
      )) {
        localStorage.setItem(key, String(value))
      }
      toast.add({
        icon: "i-lucide-refresh-cw",
        color: "success",
        title: "Данные импортированы!",
        description: "Перезагружаем приложение…",
      })
      setTimeout(() => {
        window.location.reload()
      }, 1200)
    } catch (err) {
      console.error("Import failed:", err)
      toast.add({
        icon: "i-lucide-triangle-alert",
        color: "error",
        title: "Файл не распознан",
        description: "Убедитесь, что это файл резервной копии этого приложения",
        duration: 6000,
      })
    }
  }
  reader.readAsText(file)
}

interface UiOption {
  label: string
  icon: string
  description: string
  selected: boolean
  swatch?: string
  onSelect: () => void
}

const DARK_VARIANT_ICONS: Record<string, string> = {
  neutral: "i-lucide-moon-star",
  coal: "i-lucide-moon",
  cold: "i-lucide-snowflake",
  ocean: "i-lucide-waves",
  violet: "i-lucide-gem",
  rose: "i-lucide-flower",
  warm: "i-lucide-flame",
  olive: "i-lucide-leaf",
  forest: "i-lucide-trees",
  dim: "i-lucide-cloud",
  amoled: "i-lucide-circle",
}

const optionList = computed<UiOption[]>(() => {
  switch (screen.value) {
    case "ui-radius":
      return RADIUS_OPTIONS.map((o) => ({
        label: o.label,
        description: o.description,
        selected: radius.value === o.value,
        icon: "i-lucide-circle-dot",
        onSelect: () => setRadius(o.value),
      }))
    case "dark-variant":
      return DARK_VARIANTS.map((o) => ({
        label: o.label,
        description: o.description,
        selected: darkVariant.value === o.value,
        icon: DARK_VARIANT_ICONS[o.value] ?? "i-lucide-moon",
        swatch: o.base ?? "#171717",
        onSelect: () => setDarkVariant(o.value),
      }))
    case "text-scale":
      return TEXT_SCALES.map((o) => ({
        label: o.label,
        description: o.description,
        selected: textScale.value === o.value,
        icon: "i-lucide-type",
        onSelect: () => setTextScale(o.value),
      }))
    case "density":
      return DENSITY_OPTIONS.map((o) => ({
        label: o.label,
        description: o.description,
        selected: density.value === o.value,
        icon: "i-lucide-align-justify",
        onSelect: () => setDensity(o.value),
      }))
    case "chip-style":
      return [
        {
          label: "Пастельные",
          description: "Лучше подходит к светлым темам",
          selected: chipStyle.value === "pastel",
          icon: "i-lucide-palette",
          swatch: accentHex(currentColor.value, 100),
          onSelect: () => setChipStyle("pastel"),
        },
        {
          label: "Тональные",
          description: "Лучше подходит к тёмным темам",
          selected: chipStyle.value === "tonal",
          icon: "i-lucide-brush",
          swatch: `color-mix(in srgb, ${accentHex(currentColor.value)} 32%, transparent)`,
          onSelect: () => setChipStyle("tonal"),
        },
        {
          label: "Прозрачные",
          description: "Без заливки",
          selected: chipStyle.value === "transparent",
          icon: "i-lucide-eraser",
          swatch: "transparent",
          onSelect: () => setChipStyle("transparent"),
        },
      ]
    default:
      return []
  }
})
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
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented)/45 transition-colors text-left"
                  @click="go(row.key)"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
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
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors"
                  :class="{
                    'opacity-55 cursor-not-allowed select-none': row.disabled,
                    'hover:bg-(--ui-bg-accented)/45': !row.disabled,
                  }"
                  :disabled="row.disabled"
                  @click="go(row.key)"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
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
                    class="h-5 w-5 shrink-0 rounded-full border border-(--ui-border-accented)"
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
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
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
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented)/45 transition-colors text-left"
                  @click="colorMode.preference = item.value"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
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
                <div class="flex flex-col gap-2 px-2 pb-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">Свой цвет</span>
                  </div>
                  <UColorPicker
                    :model-value="customDraft"
                    size="lg"
                    class="w-full"
                    @update:model-value="onCustomColor"
                  />
                </div>
              </template>

              <!-- BADGE COLORS LIST -->
              <template v-else-if="screen === 'colors'">
                <button
                  v-for="category in BADGE_CATEGORIES"
                  :key="category.key"
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented)/45 transition-colors text-left"
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

              <!-- UI OPTION LISTS -->
              <template
                v-else-if="
                  [
                    'ui-radius',
                    'dark-variant',
                    'text-scale',
                    'density',
                    'chip-style',
                  ].includes(screen)
                "
              >
                <div class="space-y-2 px-2 pb-3">
                  <button
                    v-for="option in optionList"
                    :key="option.label"
                    class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-(--ui-bg-accented)/45"
                    @click="option.onSelect"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
                    >
                      <UIcon
                        :name="option.icon"
                        class="h-5 w-5 text-(--ui-primary)"
                      />
                    </span>
                    <span
                      v-if="option.swatch"
                      class="h-5 w-5 shrink-0 rounded-full border border-(--ui-border-accented)"
                      :style="{ backgroundColor: option.swatch }"
                    />
                    <span class="flex-1 min-w-0">
                      <span class="block text-sm font-medium">{{
                        option.label
                      }}</span>
                      <span class="block text-xs text-(--ui-text-muted)">{{
                        option.description
                      }}</span>
                    </span>
                    <UIcon
                      v-if="option.selected"
                      name="i-lucide-check"
                      class="h-4 w-4 shrink-0 text-(--ui-primary)"
                    />
                  </button>
                </div>

                <template v-if="screen === 'chip-style'">
                  <div class="pt-2">
                    <p
                      class="px-2 pb-2 text-xs font-medium text-(--ui-text-muted)"
                    >
                      На что влияет
                    </p>
                    <div
                      class="mx-2 flex flex-col gap-2 rounded-lg border border-(--ui-border) p-3"
                    >
                      <div class="flex items-center gap-3">
                        <span
                          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
                        >
                          <UIcon
                            name="i-lucide-book-open"
                            class="h-5 w-5 text-(--ui-primary)"
                          />
                        </span>
                        <span class="text-sm">Иконки заголовков и меню</span>
                      </div>
                      <div
                        class="flex items-center gap-3 rounded-lg bg-(--ui-color-primary-100) px-2 py-2"
                      >
                        <span class="text-sm font-medium text-(--ui-primary)"
                          >Прошедшие недели</span
                        >
                        <UIcon
                          name="i-lucide-check"
                          class="h-4 w-4 text-(--ui-primary)"
                        />
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="flex h-8 w-8 items-center justify-center rounded-lg bg-(--ui-color-primary-50) text-sm font-medium"
                          >14</span
                        >
                        <span class="text-sm text-(--ui-text-muted)"
                          >Сегодня в календаре</span
                        >
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="flex h-8 w-8 items-center justify-center rounded-lg bg-(--ui-color-primary-100) text-sm font-semibold text-(--ui-primary)"
                          >20</span
                        >
                        <span class="text-sm text-(--ui-text-muted)"
                          >Выбранный день</span
                        >
                      </div>
                    </div>
                    <p class="px-2 pt-2 text-xs text-(--ui-text-muted)">
                      Изменения применяются сразу и в светлой, и в тёмной теме.
                      При «Прозрачных» остаётся только цвет без заливки.
                    </p>
                  </div>
                </template>
              </template>

              <!-- MAIN -->
              <template v-else-if="screen === 'main'">
                <button
                  class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented)/45 transition-colors text-left"
                  @click="go('groups')"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
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
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
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
                    @update:model-value="handleSetShowTutorials($event)"
                  />
                </div>
              </template>

              <!-- GROUPS -->
              <template v-else-if="screen === 'groups'">
                <div class="px-1 py-2">
                  <GroupSelector />
                </div>
              </template>

              <!-- FEEDBACK -->
              <template v-else-if="screen === 'feedback'">
                <div class="space-y-4">
                  <a
                    href="https://github.com/PurpleSwtr/asu-schedule"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented)/45 transition-colors text-left"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
                    >
                      <UIcon
                        name="i-lucide-star"
                        class="h-5 w-5 text-(--ui-primary)"
                      />
                    </span>
                    <span class="flex-1 min-w-0">
                      <span class="block text-sm font-medium"
                        >Репозиторий на GitHub</span
                      >
                      <span class="block text-xs text-(--ui-text-muted)">
                        Пока я тут стараюсь сделать удобное расписание, можете
                        поставить звёздочку на гитхабе!
                      </span>
                    </span>
                    <UIcon
                      name="i-lucide-external-link"
                      class="h-4 w-4 shrink-0 text-(--ui-text-muted)"
                    />
                  </a>
                  <a
                    href="https://github.com/PurpleSwtr/asu-schedule/issues/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented)/45 transition-colors text-left"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
                    >
                      <UIcon
                        name="i-lucide-message-square-plus"
                        class="h-5 w-5 text-(--ui-primary)"
                      />
                    </span>
                    <span class="flex-1 min-w-0">
                      <span class="block text-sm font-medium">
                        Оставить фидбек
                      </span>
                      <span class="block text-xs text-(--ui-text-muted)">
                        Запросить расписание новой группы / поделиться идеей по
                        улучшению / сообщить об ошибке
                      </span>
                    </span>
                    <UIcon
                      name="i-lucide-external-link"
                      class="h-4 w-4 shrink-0 text-(--ui-text-muted)"
                    />
                  </a>

                  <div
                    class="flex flex-col items-center gap-2 pt-4 mt-2 border-t border-(--ui-border) text-center"
                  >
                    <img
                      :src="avatar"
                      alt="Аватар автора"
                      class="h-20 w-20 shrink-0 rounded-full object-cover"
                    />
                    <p class="font-semibold">Сергеенко Михаил</p>
                    <p class="block -mt-1 text-xs text-(--ui-text-muted)">
                      студент группы 4бАСУ1
                    </p>
                    <div class="flex items-center gap-3 mt-1">
                      <a
                        href="https://github.com/PurpleSwtr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Мой GitHub"
                        class="flex h-11 w-11 items-center justify-center rounded-full bg-(--ui-bg-elevated) hover:bg-(--ui-color-primary-100) transition-colors"
                      >
                        <UIcon name="i-lucide-github" class="h-5 w-5" />
                      </a>

                      <a
                        href="https://t.me/purpleswtr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Telegram"
                        class="flex h-11 w-11 items-center justify-center rounded-full bg-(--ui-bg-elevated) hover:bg-(--ui-color-primary-100) transition-colors"
                      >
                        <UIcon name="i-lucide-send" class="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </template>

              <!-- BACKUP -->
              <template v-else-if="screen === 'backup'">
                <div class="space-y-2">
                  <div
                    class="flex items-start gap-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) px-3 py-2.5"
                  >
                    <UIcon
                      name="i-lucide-info"
                      class="h-5 w-5 shrink-0 text-(--ui-primary) mt-0.5"
                    />
                    <div class="flex-1 min-w-0 space-y-2">
                      <p class="text-xs text-(--ui-text-muted) leading-relaxed">
                        Все данные приложения хранятся только в вашем браузере.
                      </p>
                      <p class="text-xs text-(--ui-text-muted) leading-relaxed">
                        Экспорт сохраняет их в файл: перенесите его на другое
                        устройство или в другой браузер, и всё подтянется туда.
                      </p>
                      <p class="text-xs text-(--ui-text-muted) leading-relaxed">
                        Импорт заменит текущие данные содержимым файла и
                        перезапустит приложение.
                      </p>
                    </div>
                  </div>

                  <button
                    class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented)/45 transition-colors text-left"
                    @click="exportAllData"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
                    >
                      <UIcon
                        name="i-lucide-download"
                        class="h-5 w-5 text-(--ui-primary)"
                      />
                    </span>
                    <span class="flex-1 min-w-0">
                      <span class="block text-sm font-medium">Экспорт</span>
                      <span class="block text-xs text-(--ui-text-muted)"
                        >Скачать все данные в файл</span
                      >
                    </span>
                    <UIcon
                      name="i-lucide-external-link"
                      class="h-4 w-4 shrink-0 text-(--ui-text-muted)"
                    />
                  </button>

                  <button
                    class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented)/45 transition-colors text-left"
                    @click="triggerImport"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
                    >
                      <UIcon
                        name="i-lucide-upload"
                        class="h-5 w-5 text-(--ui-primary)"
                      />
                    </span>
                    <span class="flex-1 min-w-0">
                      <span class="block text-sm font-medium">Импорт</span>
                      <span class="block text-xs text-(--ui-text-muted)"
                        >Загрузить данные из файла</span
                      >
                    </span>
                    <UIcon
                      name="i-lucide-external-link"
                      class="h-4 w-4 shrink-0 text-(--ui-text-muted)"
                    />
                  </button>

                  <input
                    ref="backupInput"
                    type="file"
                    accept=".json,application/json"
                    class="hidden"
                    @change="handleImportFile"
                  />
                </div>
              </template>

              <!-- CHANGELOG -->
              <template v-else-if="screen === 'history'">
                <div class="space-y-3 pb-2">
                  <AnnouncementBlock
                    v-for="ann in historyList"
                    :key="ann.id"
                    :announcement="ann"
                  />
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
