<script setup lang="ts">
import { computed } from 'vue'
import type { Lesson } from '~/composables/useSchedule'
import type { LessonNote } from '~/composables/useLessonNotes'
import { noteColorStyle } from '~/composables/useLessonNotes'

const props = defineProps<{
  lesson: Lesson
  date?: string
  notes?: LessonNote[]
}>()

const emit = defineEmits<{
  (e: 'open-notes'): void
}>()

const { TIME_SLOTS } = useSchedule()

const scheduleLabel = computed(() => {
  switch (props.lesson.schedule) {
    case 'числитель': return { text: 'Числитель', color: 'primary' as const }
    case 'знаменатель': return { text: 'Знаменатель', color: 'secondary' as const }
    case 'месяц': return { text: '1 раз в месяц', color: 'warning' as const }
    case 'полныйдень': return { text: 'Полнодневное', color: 'error' as const }
    default: return null
  }
})

const timeRange = computed(() => {
  return TIME_SLOTS[props.lesson.paraNumber] || props.lesson.time
})
</script>

<template>
  <UCard class="w-full">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <UBadge color="neutral" variant="soft" class="shrink-0">
            {{ lesson.paraNumber }} пара
          </UBadge>
          <span class="text-sm text-gray-500 whitespace-nowrap">{{ timeRange }}</span>
          <UBadge
            v-if="scheduleLabel"
            :color="scheduleLabel.color"
            variant="soft"
            class="shrink-0"
          >
            {{ scheduleLabel.text }}
          </UBadge>
        </div>
        <div class="font-semibold text-base mb-1 break-words">{{ lesson.subject }}</div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
          <span class="break-words">{{ lesson.type }}</span>
          <span v-if="lesson.teacher" class="text-gray-400 break-words">{{ lesson.teacher }}</span>
        </div>
      </div>
      <div class="flex items-start gap-2 shrink-0">
        <UBadge
          v-if="lesson.room && lesson.room !== '-'"
          color="neutral"
          variant="outline"
        >
          {{ lesson.room }}
        </UBadge>
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="sm"
          @click.stop="emit('open-notes')"
        />
      </div>
    </div>

    <div v-if="notes?.length" class="mt-3 pt-3 border-t border-(--ui-border) space-y-2">
      <div
        v-for="(note, i) in notes"
        :key="i"
        class="flex items-start gap-2 border rounded-lg px-3 py-2"
        :style="noteColorStyle(note.color)"
      >
        <UIcon :name="note.icon" class="h-4 w-4 shrink-0 mt-0.5 text-(--ui-text-muted)" />
        <p class="text-sm flex-1 break-words">{{ note.text }}</p>
      </div>
    </div>
  </UCard>
</template>
