<script setup lang="ts">
import type { Lesson } from "~/composables/useSchedule"
import type { LessonNote } from "~/composables/useLessonNotes"

const { currentGroup, grouped, total } = useNoteSubjects()
const { load, getNotes, addNote, updateNote, removeNote } = useLessonNotes()

onMounted(() => {
  load()
})

const modal = ref<{ date: string; para: number; lesson: Lesson | null } | null>(
  null,
)
const modalOpen = computed(() => modal.value !== null)
const modalNotes = computed(() =>
  modal.value ? getNotes(modal.value.date, modal.value.para) : [],
)

const openModal = (date: string, para: number, lesson: Lesson | null) => {
  modal.value = { date, para, lesson }
}

const handleAdd = (note: LessonNote) => {
  if (!modal.value) return
  addNote(modal.value.date, modal.value.para, note)
}

const handleUpdate = (index: number, note: LessonNote) => {
  if (!modal.value) return
  updateNote(modal.value.date, modal.value.para, index, note)
}

const handleRemove = (index: number) => {
  if (!modal.value) return
  removeNote(modal.value.date, modal.value.para, index)
}
</script>

<template>
  <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4">
    <div class="max-w-3xl mx-auto">
      <div class="mb-4">
        <h2 class="text-lg font-bold">Заметки по предметам</h2>
        <p class="text-xs text-(--ui-text-muted)">
          {{ currentGroup }} · {{ total }}
          {{ total === 1 ? "заметка" : "заметок" }}
        </p>
      </div>

      <div v-if="total === 0" class="mt-10 text-center">
        <UIcon
          name="i-lucide-sticky-note"
          class="mb-2 h-10 w-10 text-(--ui-text-muted)"
        />
        <p class="text-sm text-(--ui-text-muted)">Пока нет ни одной заметки</p>
      </div>

      <div v-else class="space-y-6 pb-4">
        <section v-for="s in grouped.subjects" :key="s.subject">
          <div class="mb-2 flex items-center gap-2">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
            >
              <UIcon
                name="i-lucide-book-marked"
                class="h-5 w-5 text-(--ui-primary)"
              />
            </span>
            <h3 class="text-sm font-semibold">{{ s.subject }}</h3>
            <span class="text-xs text-(--ui-text-muted)">
              {{ s.notes.length }}
            </span>
          </div>

          <div class="space-y-2">
            <NoteBlock
              v-for="(e, i) in s.notes"
              :key="`${e.date}-${e.para}-${e.note.text}-${e.note.color}-${i}`"
              :note="e.note"
              :meta="`${e.date} · ${e.para} пара · ${e.lesson?.time} · ${e.lesson?.type}`"
              @click="openModal(e.date, e.para, e.lesson)"
            />
          </div>
        </section>

        <section v-if="grouped.dayNotes.length">
          <div class="mb-2 flex items-center gap-2">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
            >
              <UIcon
                name="i-lucide-calendar-days"
                class="h-5 w-5 text-(--ui-primary)"
              />
            </span>
            <h3 class="text-sm font-semibold">Заметки на день</h3>
            <span class="text-xs text-(--ui-text-muted)">
              {{ grouped.dayNotes.length }}
            </span>
          </div>

          <div class="space-y-2">
            <NoteBlock
              v-for="(e, i) in grouped.dayNotes"
              :key="`${e.date}-${e.note.text}-${e.note.color}-${i}`"
              :note="e.note"
              :meta="`${e.date} · Заметка на день`"
              @click="openModal(e.date, e.para, null)"
            />
          </div>
        </section>

        <section v-if="grouped.other.length">
          <div class="mb-2 flex items-center gap-2">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-bg-accented)"
            >
              <UIcon
                name="i-lucide-help-circle"
                class="h-5 w-5 text-(--ui-text-muted)"
              />
            </span>
            <h3 class="text-sm font-semibold">Другое</h3>
            <span class="text-xs text-(--ui-text-muted)">
              {{ grouped.other.length }}
            </span>
          </div>

          <div class="space-y-2">
            <NoteBlock
              v-for="(e, i) in grouped.other"
              :key="`${e.date}-${e.note.text}-${e.note.color}-${i}`"
              :note="e.note"
              :meta="`${e.date} · ${e.para} пара`"
              @click="openModal(e.date, e.para, null)"
            />
          </div>
        </section>
      </div>
    </div>

    <LessonNotesModal
      :lesson="modal?.lesson ?? null"
      :date="modal?.date ?? ''"
      :notes="modalNotes"
      :open="modalOpen"
      @update:open="
        (v) => {
          if (!v) modal = null
        }
      "
      @add="handleAdd"
      @update="handleUpdate"
      @remove="handleRemove"
    />
  </div>
</template>
