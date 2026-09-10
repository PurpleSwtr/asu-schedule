<script setup lang="ts">
import type { LessonNote } from '~/composables/useLessonNotes'
import { noteColorStyle, noteColorHex } from '~/composables/useLessonNotes'

const props = defineProps<{
  note: LessonNote
  meta?: string
  truncateMeta?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <div
    class="cursor-pointer rounded-lg border px-3 py-2 transition-colors hover:bg-(--ui-bg-accented)"
    :style="noteColorStyle(note.color)"
    @click="emit('click')"
  >
    <template v-if="meta">
      <div class="mb-1 flex items-center gap-2">
        <UIcon
          :name="note.icon"
          class="h-5 w-5 shrink-0"
          :style="{ color: noteColorHex(note.color) }"
        />
        <span
          class="text-xs text-(--ui-text-muted)"
          :class="truncateMeta ? 'min-w-0 flex-1 truncate' : ''"
        >{{ meta }}</span>
      </div>
      <p class="break-words text-sm whitespace-pre-wrap">{{ note.text }}</p>
    </template>
    <div v-else class="flex items-start gap-2">
      <UIcon
        :name="note.icon"
        class="h-5 w-5 shrink-0 mt-0.5"
        :style="{ color: noteColorHex(note.color) }"
      />
      <p class="text-sm flex-1 break-words whitespace-pre-wrap">{{ note.text }}</p>
    </div>
  </div>
</template>