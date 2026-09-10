<script setup lang="ts">
const { groups, currentGroup, setGroup } = useSchedule()

const emit = defineEmits(['change'])

const select = (id: string) => {
  if (id === currentGroup.value) return
  setGroup(id)
  emit('change')
}
</script>

<template>
  <div class="space-y-1 pb-2">
    <button
      v-for="g in groups"
      :key="g.id"
      type="button"
      class="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
      :class="
        g.id === currentGroup
          ? 'bg-(--ui-color-primary-100) text-(--ui-primary)'
          : 'hover:bg-(--ui-bg-accented)/45'
      "
      @click="select(g.id)"
    >
      <span class="text-sm font-medium">{{ g.name }}</span>
      <UIcon
        v-if="g.id === currentGroup"
        name="i-lucide-check"
        class="h-4 w-4 shrink-0"
      />
    </button>
  </div>
</template>