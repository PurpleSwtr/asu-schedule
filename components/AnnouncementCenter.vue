<script setup lang="ts">
import type { Announcement } from "~/composables/useAnnouncements"

const toast = useToast()
const { init, pendingModals, pendingToasts, markSeen } = useAnnouncements()
const { fire } = useConfetti()

const currentModal = ref<Announcement | null>(null)
const modalQueue = ref<Announcement[]>([])
const toastTimer = ref<ReturnType<typeof setTimeout> | null>(null)

let shownModals = 0
let shownToasts = 0

const queueModals = () => {
  modalQueue.value = pendingModals.value.slice()
  if (modalQueue.value.length > 0) {
    shownModals = 0
    showNextModal()
  }
}

const showNextModal = () => {
  if (shownModals >= modalQueue.value.length) {
    currentModal.value = null
    return
  }
  const next = modalQueue.value[shownModals]
  if (next.delay) {
    setTimeout(
      () => {
        currentModal.value = next
        shownModals++
      },
      next.delay * (shownModals + 1),
    )
  } else {
    currentModal.value = next
    shownModals++
  }
}

const closeModal = () => {
  if (currentModal.value) {
    const ann = currentModal.value
    ann.onClose?.()
    markSeen(ann.id)
    currentModal.value = null
    showNextModal()
  }
}

const queueToasts = () => {
  const list = pendingToasts.value.slice()
  shownToasts = 0
  const showNextToast = () => {
    if (shownToasts >= list.length) return
    const ann = list[shownToasts]
    const run = () => {
      if (shownToasts >= list.length) return
      shownToasts++
      toast.add({
        title: ann.title,
        description: ann.message,
        icon: ann.icon,
        duration: ann.duration ?? 4000,
        onClick: () => {
          markSeen(ann.id)
          toast.remove(ann.id)
        },
      })
      markSeen(ann.id)
      toastTimer.value = setTimeout(showNextToast, (ann.duration ?? 4000) + 400)
    }
    if (ann.delay) {
      toastTimer.value = setTimeout(run, ann.delay * shownToasts)
    } else {
      run()
    }
  }
  showNextToast()
}

watch(currentModal, (modal) => {
  if (modal) {
    fire({
      emojis: ["📅", "🎉", "✨", "🏆", "⭐"],
      emojiCount: 10,
      emojiSize: 72,
      colorCount: 40,
    })
  }
})

onMounted(() => {
  init()
  queueModals()
  queueToasts()
})

onBeforeUnmount(() => {
  if (toastTimer.value) clearTimeout(toastTimer.value)
})
</script>

<template>
  <UModal
    :open="currentModal !== null"
    :ui="{ overlay: 'bg-black/60' }"
    @update:open="
      (v: boolean) => {
        if (v) return
      }
    "
  >
    <template #content>
      <div v-if="currentModal" class="p-5">
        <div class="flex items-center justify-between mb-4">
          <span class="text-lg font-bold">{{ currentModal.title }}</span>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="closeModal"
          />
        </div>
        <div v-if="currentModal.items?.length" class="space-y-4">
          <div
            v-for="item in currentModal.items"
            :key="item.title"
            class="flex items-start gap-3"
          >
            <div
              class="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg bg-(--ui-primary-100)"
            >
              <UIcon :name="item.icon" class="h-5 w-5 text-(--ui-primary)" />
            </div>
            <div>
              <p class="font-semibold text-sm">{{ item.title }}</p>
              <p class="text-sm text-(--ui-text-muted)">{{ item.message }}</p>
            </div>
          </div>
        </div>
        <div v-else class="flex items-start gap-3">
          <div
            class="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg bg-(--ui-primary-100)"
          >
            <UIcon
              :name="currentModal.icon!"
              class="h-5 w-5 text-(--ui-primary)"
            />
          </div>
          <p class="text-sm text-(--ui-text-muted)">
            {{ currentModal.message }}
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>
