<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"

const { weeks, currentWeek, setWeek, getWeekTypeLabel, realWeekNumber } =
  useSchedule()
const { currentColor } = useAccentColor()

const pastStyle = (isPast: boolean) => {
  if (!isPast) return undefined
  const hex = accentHex(currentColor.value)
  return {
    color: hex,
    backgroundColor: `color-mix(in srgb, ${hex} 16%, transparent)`,
  }
}

const emit = defineEmits(["change"])

const items = computed(() =>
  weeks.value.map((w) => ({
    number: w.number,
    typeLabel: getWeekTypeLabel(w.type),
    dates: w.dates || "",
    isPast: w.number < realWeekNumber.value,
  })),
)

const btnEls = ref<HTMLElement[]>([])

const scrollActiveIntoView = async () => {
  await nextTick()
  const idx = items.value.findIndex((w) => w.number === currentWeek.value)
  const el = btnEls.value[idx]
  if (el) {
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }
}

watch(currentWeek, () => scrollActiveIntoView())
onMounted(() => scrollActiveIntoView())

const onUpdate = (number: number) => {
  setWeek(number)
  emit("change")
}
</script>

<template>
  <div
    class="flex overflow-x-auto scrollbar-none gap-2 -mx-1 px-1 snap-x snap-mandatory"
  >
    <button
      v-for="(w, i) in items"
      :key="w.number"
      :ref="(el: any) => { if (el) btnEls[i] = el }"
      class="snap-center shrink-0 relative rounded-xl px-4 py-2.5 min-w-[7rem] text-center transition-colors"
      :class="
        currentWeek === w.number
          ? 'bg-(--ui-primary) text-white'
          : w.isPast
            ? ''
            : 'bg-(--ui-bg-elevated) text-(--ui-text) hover:bg-(--ui-bg-accented)'
      "
      :style="pastStyle(w.isPast && currentWeek !== w.number)"
      @click="onUpdate(w.number)"
    >
      <UIcon
        v-if="w.isPast"
        name="i-lucide-check"
        class="absolute top-1 right-1 h-3.5 w-3.5"
      />
      <span class="block font-bold text-base leading-tight">
        {{ w.typeLabel }}
      </span>
      <span class="block text-xs mt-0.5 opacity-80">{{ w.dates }}</span>
    </button>
  </div>
</template>