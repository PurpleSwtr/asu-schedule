<script setup lang="ts">
import { computed } from 'vue'
import { today, getLocalTimeZone } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

const { scheduleData, currentGroup, selectDate, currentDay } = useSchedule()

const modelValue = ref<DateValue>(today(getLocalTimeZone()))

const onSelect = (value: DateValue) => {
  modelValue.value = value
  const date = value.toDate(getLocalTimeZone())
  selectDate(date)
}
</script>

<template>
  <UCalendar
    v-model="modelValue"
    :week-starts-on="1"
    locale="ru"
    weekday-format="short"
    class="w-full"
    @update:model-value="onSelect"
  />
</template>
