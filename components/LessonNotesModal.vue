<script setup lang="ts">
import type { Lesson } from '~/composables/useSchedule'
import type { LessonNote } from '~/composables/useLessonNotes'
import { noteColorStyle } from '~/composables/useLessonNotes'

const props = defineProps<{
  lesson?: Lesson | null
  date: string
  notes: LessonNote[]
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'add', note: LessonNote): void
  (e: 'remove', index: number): void
}>()

const { NOTE_ICONS, NOTE_COLORS } = useLessonNotes()

const input = ref('')
const selectedIcon = ref(NOTE_ICONS[0])
const selectedColor = ref('blue')

const add = () => {
  const text = input.value.trim()
  if (!text) return
  emit('add', {
    text,
    icon: selectedIcon.value,
    color: selectedColor.value,
  })
  input.value = ''
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-4">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-sm">
            {{ lesson ? `${lesson.paraNumber} пара · ${lesson.subject}` : 'Заметка на день' }}
          </span>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="emit('update:open', false)" />
        </div>
        <p class="text-xs text-(--ui-text-muted) mb-4">
          {{ date }}{{ lesson ? ` · ${lesson.teacher} · ${lesson.room}` : '' }}
        </p>

        <div v-if="notes.length" class="space-y-2 mb-4">
          <div
            v-for="(note, i) in notes"
            :key="i"
            class="flex items-start gap-2 border rounded-lg px-3 py-2"
            :style="noteColorStyle(note.color)"
          >
            <UIcon :name="note.icon" class="h-4 w-4 shrink-0 mt-0.5 text-(--ui-text-muted)" />
            <p class="text-sm flex-1 break-words whitespace-pre-wrap">{{ note.text }}</p>
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" class="shrink-0 mt-0.5" @click="emit('remove', i)" />
          </div>
        </div>
        <div v-else class="flex flex-col items-center py-4 mb-4">
          <UIcon name="i-lucide-sticky-note" class="h-8 w-8 text-(--ui-text-muted) mb-2" />
          <p class="text-xs text-(--ui-text-muted)">Заметок пока нет</p>
        </div>

        <div class="space-y-3">
          <div>
            <p class="text-xs font-semibold text-(--ui-text-muted) mb-2">Цвет</p>
            <div class="flex gap-2">
              <button
                v-for="c in NOTE_COLORS"
                :key="c.name"
                class="relative h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                :style="{ backgroundColor: c.hex }"
                @click="selectedColor = c.name"
              >
                <UIcon
                  v-if="selectedColor === c.name"
                  name="i-lucide-check"
                  class="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm"
                />
              </button>
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-(--ui-text-muted) mb-2">Иконка</p>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="ic in NOTE_ICONS"
                :key="ic"
                class="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-(--ui-bg-elevated)"
                :class="selectedIcon === ic ? 'bg-(--ui-bg-elevated) ring-1 ring-(--ui-border)' : ''"
                @click="selectedIcon = ic"
              >
                <UIcon :name="ic" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="flex gap-2">
            <UInput v-model="input" placeholder="Новая заметка…" class="flex-1" @keyup.enter="add" />
            <UButton icon="i-lucide-plus" label="Добавить" @click="add" />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
