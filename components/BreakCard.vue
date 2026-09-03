<script setup lang="ts">
import type { BreakSlot } from '~/composables/useSchedule'

defineProps<{
  slot: BreakSlot
}>()

const { getParaEndTime, getParaStartTime, TIME_SLOTS } = useSchedule()
</script>

<template>
  <div class="flex items-center gap-3 px-2 py-1.5">
    <div class="flex-1 border-t border-dashed border-(--ui-border)" />
    <span class="text-xs text-(--ui-text-muted) whitespace-nowrap shrink-0">
      Перерыв · {{ getParaEndTime(slot.fromPara) }} – {{ getParaStartTime(slot.toPara) }}
    </span>
    <div class="flex-1 border-t border-dashed border-(--ui-border)" />
  </div>
</template>
