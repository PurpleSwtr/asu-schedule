<script setup lang="ts">
import { computed } from 'vue'
import type { Lesson } from '~/composables/useSchedule'
import type { LessonNote } from '~/composables/useLessonNotes'

const props = defineProps<{
  lesson: Lesson
  date?: string
  notes?: LessonNote[]
}>()

const emit = defineEmits<{
  (e: 'open-notes'): void
}>()

const { TIME_SLOTS } = useSchedule()
const { styleForType, categoryForType, styleForSchedule } = useBadgeColors()

const typeCategory = computed(() => categoryForType(props.lesson.type))
const typeStyle = computed(() =>
  typeCategory.value ? styleForType(props.lesson.type) : null,
)

const scheduleLabel = computed(() => {
  switch (props.lesson.schedule) {
    case 'числитель':
      return { text: 'Числитель', style: styleForSchedule('числитель') }
    case 'знаменатель':
      return { text: 'Знаменатель', style: styleForSchedule('знаменатель') }
    case 'месяц':
      return { text: '1 раз в месяц', style: styleForSchedule('месяц') }
    case 'полныйдень': return { text: 'Полнодневное', style: null }
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
          <span class="text-sm text-(--ui-text-muted) whitespace-nowrap">{{ timeRange }}</span>
          <UBadge
            v-if="scheduleLabel && !scheduleLabel.style"
            color="error"
            variant="soft"
            class="shrink-0"
          >
            {{ scheduleLabel.text }}
          </UBadge>
          <UBadge
            v-else-if="scheduleLabel"
            color="neutral"
            variant="soft"
            class="shrink-0"
            :style="scheduleLabel.style"
          >
            {{ scheduleLabel.text }}
          </UBadge>
        </div>
        <div class="font-semibold text-base mb-1 break-words">{{ lesson.subject }}</div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--ui-text)">
          <UBadge
            v-if="typeStyle"
            color="neutral"
            variant="soft"
            class="shrink-0"
            :style="typeStyle"
          >
            <template v-if="typeCategory?.icon" #leading>
              <UIcon :name="typeCategory.icon" class="h-3.5 w-3.5" />
            </template>
            {{ lesson.type }}
          </UBadge>
          <UBadge
            v-else
            color="neutral"
            variant="soft"
            class="shrink-0"
          >{{ lesson.type }}</UBadge>
          <span
            v-if="lesson.teacher"
            class="text-sm text-(--ui-text-muted) break-words"
          >{{ lesson.teacher }}</span>
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
      <NoteBlock
        v-for="(note, i) in notes"
        :key="i"
        :note="note"
        @click="emit('open-notes')"
      />
    </div>
  </UCard>
</template>
