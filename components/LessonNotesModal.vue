<script setup lang="ts">
import type { Lesson } from '~/composables/useSchedule'
import type { LessonNote } from '~/composables/useLessonNotes'
import { noteColorStyle, noteColorHex } from '~/composables/useLessonNotes'

const props = defineProps<{
  lesson?: Lesson | null
  date: string
  notes: LessonNote[]
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'add', note: LessonNote): void
  (e: 'update', index: number, note: LessonNote): void
  (e: 'remove', index: number): void
}>()

const { NOTE_ICONS, NOTE_COLORS } = useLessonNotes()

const input = ref('')
const selectedIcon = ref(NOTE_ICONS[0])
const selectedColor = ref('blue')
const editingIndex = ref<number | null>(null)

const isEditing = computed(() => editingIndex.value !== null)

const keyedNotes = computed(() => {
  const seen: Record<string, number> = {}
  return props.notes.map((note, index) => {
    const base = `${note.text}|${note.icon}|${note.color}`
    const count = seen[base] ?? 0
    seen[base] = count + 1
    return { note, index, key: `${base}|${count}` }
  })
})

watch(() => props.open, (open) => {
  if (open) {
    editingIndex.value = null
    input.value = ''
    selectedIcon.value = NOTE_ICONS[0]
    selectedColor.value = 'blue'
  }
})

const startEdit = (i: number) => {
  const note = props.notes[i]
  if (!note) return
  editingIndex.value = i
  input.value = note.text
  selectedIcon.value = note.icon
  selectedColor.value = note.color
}

const cancelEdit = () => {
  editingIndex.value = null
  input.value = ''
  selectedIcon.value = NOTE_ICONS[0]
  selectedColor.value = 'blue'
}

const save = () => {
  const text = input.value.trim()
  if (!text) return
  if (isEditing.value) {
    emit('update', editingIndex.value as number, {
      text,
      icon: selectedIcon.value,
      color: selectedColor.value,
    })
    editingIndex.value = null
  } else {
    emit('add', {
      text,
      icon: selectedIcon.value,
      color: selectedColor.value,
    })
  }
  input.value = ''
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div
        class="p-4 overflow-y-auto"
        style="max-height: min(calc(100dvh - 2rem), 640px)"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-sm">
            {{ isEditing
              ? 'Редактирование заметки'
              : lesson
                ? `${lesson.paraNumber} пара · ${lesson.subject}`
                : 'Заметка на день' }}
          </span>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="emit('update:open', false)" />
        </div>
        <p class="text-xs text-(--ui-text-muted) mb-4">
          {{ date }}{{ lesson ? ` · ${lesson.teacher} · ${lesson.room}` : '' }}
        </p>

        <div v-if="notes.length" class="space-y-2 mb-4">
          <AnimatePresence>
            <Motion
              v-for="item in keyedNotes"
              :key="item.key"
              layout
              class="flex items-start gap-2 border rounded-lg px-3 py-2"
              :style="noteColorStyle(item.note.color)"
              :initial="{ opacity: 0, scale: 0.9, y: 8 }"
              :animate="{ opacity: 1, scale: 1, y: 0 }"
              :exit="{ opacity: 0, scale: 0.9, y: -8 }"
              :transition="{ duration: 0.18, ease: 'easeOut' }"
            >
              <UIcon
                :name="item.note.icon"
                class="h-5 w-5 shrink-0 mt-0.5"
                :style="{ color: noteColorHex(item.note.color) }"
              />
              <p class="text-sm flex-1 break-words whitespace-pre-wrap">{{ item.note.text }}</p>
              <div class="flex items-center gap-0.5 shrink-0 mt-0.5">
                <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="xs" aria-label="Редактировать заметку" @click="startEdit(item.index)" />
                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" aria-label="Удалить заметку" @click="emit('remove', item.index)" />
              </div>
            </Motion>
          </AnimatePresence>
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

          <div class="space-y-2">
            <UInput
              v-model="input"
              :placeholder="isEditing ? 'Редактировать заметку…' : 'Новая заметка…'"
              class="w-full"
              @keyup.enter="save"
            />
            <div class="flex gap-2">
              <UButton
                v-if="isEditing"
                icon="i-lucide-x"
                color="neutral"
                variant="outline"
                label="Отменить"
                class="flex-1 justify-center"
                @click="cancelEdit"
              />
              <UButton
                :icon="isEditing ? 'i-lucide-check' : 'i-lucide-plus'"
                :label="isEditing ? 'Сохранить' : 'Добавить'"
                class="flex-1 justify-center"
                @click="save"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
