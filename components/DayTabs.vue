<script setup lang="ts">
import { computed } from 'vue'

const { days, currentDay, setDay, weekDaysWithDates } = useSchedule()

const emit = defineEmits(['change'])

const shortDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const items = computed(() =>
  weekDaysWithDates.value.map((d, i) => ({
    label: `${shortDays[i] || d.name} ${d.date}`
  }))
)

const selectedIndex = computed(() => {
  const idx = days.value.indexOf(currentDay.value)
  return idx >= 0 ? idx : 0
})

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
    class="flex overflow-x-auto scrollbar-none gap-1 -mx-1 px-1 snap-x snap-mandatory"
  >
    <button
      v-for="(d, i) in items"
      :key="i"
      class="snap-center shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap"
      :class="selectedIndex === i
        ? 'bg-(--ui-primary) text-white'
        : 'bg-(--ui-bg-elevated) text-(--ui-text) hover:bg-(--ui-bg-accented)'"
      @click="onUpdate(i)"
    >
      {{ d.label }}
    </button>
  </div>
</template>
