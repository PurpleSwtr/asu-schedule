<script setup lang="ts">
import { computed } from 'vue'
import type { BreakSlot } from '~/composables/useSchedule'

const props = defineProps<{
  slot: BreakSlot
  index?: number
  direction?: number
  active?: boolean
}>()

const { getParaEndTime, getParaStartTime, TIME_SLOTS } = useSchedule()

const entranceDelay = computed(() => Math.min(props.index ?? 0, 10) * 0.06)
const entranceY = computed(() => 20 * (props.direction ?? 1))

const shown = useReveal(() => props.active)
</script>

<template>
  <Motion
    class="flex items-center gap-3 px-2 py-1.5"
    :initial="false"
    :animate="
      shown
        ? { opacity: 1, y: 0, scale: 1 }
        : { opacity: 0, y: entranceY, scale: 0.97 }
    "
    :transition="
      shown
        ? { type: 'spring', stiffness: 260, damping: 22, delay: entranceDelay }
        : { duration: 0 }
    "
  >
    <div class="flex-1 border-t border-dashed border-(--ui-border)" />
    <span class="text-xs text-(--ui-text-muted) whitespace-nowrap shrink-0">
      Перерыв · {{ getParaEndTime(slot.fromPara) }} – {{ getParaStartTime(slot.toPara) }}
    </span>
    <div class="flex-1 border-t border-dashed border-(--ui-border)" />
  </Motion>
</template>
