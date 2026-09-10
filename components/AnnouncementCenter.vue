<script setup lang="ts">
import type { Announcement } from "~/composables/useAnnouncements"

const toast = useToast()
const { init, pendingModals, pendingToasts, markSeen } = useAnnouncements()
const { fire } = useConfetti()
const { init: initAppSettings, showTutorials } = useAppSettings()
const { init: initFirstLaunch } = useFirstLaunch()

const currentList = ref<Announcement[] | null>(null)
const toastTimer = ref<ReturnType<typeof setTimeout> | null>(null)

let shownToasts = 0

const queueModals = () => {
  const list = pendingModals.value.slice()
  if (list.length > 0) {
    currentList.value = list.reverse()
  }
}

const closeModal = () => {
  if (currentList.value) {
    for (const ann of currentList.value) {
      ann.onClose?.()
      markSeen(ann.id)
    }
    currentList.value = null
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

watch(currentList, (list) => {
  if (list) {
    fire({
      emojis: ["📅", "🎉", "✨", "🏆", "⭐"],
      emojiCount: 10,
      emojiSize: 72,
      colorCount: 40,
    })
  }
})

watch(showTutorials, (v) => {
  if (!v) currentList.value = null
})

onMounted(() => {
  init()
  initAppSettings()
  initFirstLaunch()
  if (!showTutorials.value) return
  queueModals()
  queueToasts()
})

onBeforeUnmount(() => {
  if (toastTimer.value) clearTimeout(toastTimer.value)
})
</script>

<template>
  <UModal
    :open="currentList !== null"
    :ui="{ overlay: 'bg-black/60' }"
    @update:open="
      (v: boolean) => {
        if (v) return
      }
    "
  >
    <template #content>
      <div v-if="currentList" class="p-5">
        <div class="flex items-center justify-between mb-4">
          <span class="text-lg font-bold">Что нового?</span>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="closeModal"
          />
        </div>
        <div
          class="space-y-3 overflow-y-auto pr-1 pb-2"
          style="max-height: calc(100vh - 220px)"
        >
          <AnnouncementBlock
            v-for="ann in currentList"
            :key="ann.id"
            :announcement="ann"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>