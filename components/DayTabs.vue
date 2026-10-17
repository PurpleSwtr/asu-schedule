<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'

const { days, currentDay, setDay, weekDaysWithDates } = useSchedule()

const emit = defineEmits(['change'])

const shortDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const items = computed(() =>
  weekDaysWithDates.value.map((d, i) => ({
    label: `${shortDays[i] || d.name} ${d.date}`
  }))
)

const selectedIndex = computed(() => {
  const idx = days.value.indexOf(currentDay.value)
  return idx >= 0 ? idx : 0
})

const scrollEl = ref<HTMLElement | null>(null)
const btnEls = ref<HTMLElement[]>([])

const scrollActiveIntoView = async (behavior: ScrollBehavior = 'smooth') => {
  await nextTick()
  const el = btnEls.value[selectedIndex.value]
  if (!el) return
  el.scrollIntoView({ behavior, inline: 'center', block: 'nearest' })
}

watch(selectedIndex, () => scrollActiveIntoView())

onMounted(() => scrollActiveIntoView('auto'))

const onUpdate = (index: number) => {
  const day = days.value[index]
  if (day) {
    setDay(day)
    emit('change')
  }
}
</script>

<template>
  <div
    ref="scrollEl"
    class="flex overflow-x-auto scrollbar-none gap-1 -mx-1 px-1 snap-x snap-mandatory"
  >
    <Motion
      v-for="(d, i) in items"
      :key="i"
      as="button"
      :ref="(el: any) => { if (el) btnEls[i] = el.$el ?? el }"
      :while-press="{ scale: 0.94 }"
      :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
      class="relative snap-center shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
      :class="selectedIndex === i
        ? 'text-white'
        : 'bg-(--ui-bg-elevated) text-(--ui-text) hover:bg-(--ui-bg-accented)'"
      @click="onUpdate(i)"
    >
      <Motion
        v-if="selectedIndex === i"
        layout-id="day-tab-pill"
        class="absolute inset-0 rounded-lg bg-(--ui-primary)"
        :transition="{ type: 'spring', stiffness: 500, damping: 40 }"
      />
      <span class="relative z-10">{{ d.label }}</span>
    </Motion>
  </div>
</template>
