<script setup lang="ts">
import { computed } from 'vue'

const { groups, currentGroup, setGroup } = useSchedule()

const emit = defineEmits(['change'])

const isPinned = ref(false)

onMounted(() => {
  isPinned.value = localStorage.getItem('asu-schedule-pinned') === 'true'
})

const options = computed(() =>
  groups.value.map(g => ({
    label: g.name,
    value: g.id
  }))
)

const onUpdate = (value: unknown) => {
  if (typeof value === 'string') {
    setGroup(value)
    emit('change')
  }
}

const togglePin = () => {
  isPinned.value = !isPinned.value
  localStorage.setItem('asu-schedule-pinned', isPinned.value.toString())
}
</script>

<template>
  <div class="flex items-center gap-2">
    <USelect
      :model-value="currentGroup"
      :items="options"
      value-key="value"
      label-key="label"
      class="flex-1"
      placeholder="Выберите группу"
      @update:model-value="onUpdate"
    />
    <UTooltip text="Закрепить группу — она будет открываться автоматически">
      <UButton
        :icon="isPinned ? 'i-lucide-pin' : 'i-lucide-pin-off'"
        :color="isPinned ? 'primary' : 'neutral'"
        variant="ghost"
        size="sm"
        :aria-label="isPinned ? 'Открепить группу' : 'Закрепить группу'"
        @click="togglePin"
      />
    </UTooltip>
  </div>
</template>
