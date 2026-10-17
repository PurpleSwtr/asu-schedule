<script setup lang="ts">
import type { BreakSlot } from '~/composables/useSchedule'

const props = defineProps<{
  slot: BreakSlot
  index?: number
}>()

const { getParaEndTime, getParaStartTime, TIME_SLOTS } = useSchedule()

const entranceDelay = computed(() => Math.min(props.index ?? 0, 8) * 0.045)
</script>

<template>
  <Motion
    class="flex items-center gap-3 px-2 py-1.5"
    :initial="{ opacity: 0, y: 10 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
      delay: entranceDelay,
    }"
  >
    <div class="flex-1 border-t border-dashed border-(--ui-border)" />
    <span class="text-xs text-(--ui-text-muted) whitespace-nowrap shrink-0">
      Перерыв · {{ getParaEndTime(slot.fromPara) }} – {{ getParaStartTime(slot.toPara) }}
    </span>
    <div class="flex-1 border-t border-dashed border-(--ui-border)" />
  </Motion>
</template>
