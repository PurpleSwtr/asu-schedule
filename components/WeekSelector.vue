<script setup lang="ts">
import { computed } from 'vue'

const { weeks, currentWeek, setWeek, getWeekTypeLabel } = useSchedule()

const emit = defineEmits(['change'])

const options = computed(() =>
  weeks.value.map(w => ({
    label: `Неделя ${w.number} · ${getWeekTypeLabel(w.type)}${w.dates ? ` · ${w.dates}` : ''}`,
    value: w.number
  }))
)

const onUpdate = (value: unknown) => {
  if (typeof value === 'number') {
    setWeek(value)
    emit('change')
  }
}
</script>

<template>
  <USelect
    :model-value="currentWeek"
    :items="options"
    value-key="value"
    label-key="label"
    class="w-full"
    placeholder="Выберите неделю"
    @update:model-value="onUpdate"
  />
</template>