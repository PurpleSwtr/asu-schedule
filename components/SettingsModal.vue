<script setup lang="ts">
import type { BadgeCategory } from "~/composables/useBadgeColors"
import { accentHex } from "~/composables/useAccentColor"
import avatar from "~/assets/avatar.webp"

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
{
    key: "feedback" as Screen,
    label: "Обратная связь",
    subtitle: "Звёздочка, контакты, запрос группы",
    icon: "i-lucide-heart-handshake",
  },
  {
    key: "history" as Screen,
    label: "История изменений",
    subtitle: "Что уже появилось",
    icon: "i-lucide-history",
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

const { all: allAnnouncements } = useAnnouncements()
const historyList = computed(() => [...allAnnouncements].reverse())
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
                    class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented) transition-colors text-left"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-primary-100)"
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
                    class="w-full flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-(--ui-bg-accented) transition-colors text-left"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-primary-100)"
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
                        class="flex h-11 w-11 items-center justify-center rounded-full bg-(--ui-bg-elevated) hover:bg-(--ui-primary-100) transition-colors"
                      >
                        <UIcon name="i-lucide-github" class="h-5 w-5" />
                      </a>

                      <a
                        href="https://t.me/purpleswtr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Telegram"
                        class="flex h-11 w-11 items-center justify-center rounded-full bg-(--ui-bg-elevated) hover:bg-(--ui-primary-100) transition-colors"
                      >
                        <UIcon name="i-lucide-send" class="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </template>

              <!-- CHANGELOG -->
              <template v-else-if="screen === 'history'">
                <div
                  class="space-y-3 overflow-y-auto pr-1 pb-2"
                  style="max-height: calc(100vh - 220px)"
                >
                  <div
                    v-for="ann in historyList"
                    :key="ann.id"
                    class="rounded-xl border border-(--ui-border) p-3"
                  >
                    <p class="font-semibold text-sm">{{ ann.title }}</p>
                    <div class="mt-3 space-y-3">
                      <div
                        v-for="item in ann.items"
                        :key="item.title"
                        class="flex items-start gap-3"
                      >
                        <div
                          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--ui-primary-100)"
                        >
                          <UIcon
                            :name="item.icon"
                            class="h-4 w-4 text-(--ui-primary)"
                          />
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-medium">{{ item.title }}</p>
                          <p class="text-xs leading-relaxed text-(--ui-text-muted)">
                            {{ item.message }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
