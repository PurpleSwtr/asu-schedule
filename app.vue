<script setup lang="ts">
const { init } = useAccentColor()
const {
  showModal,
  init: initFirstLaunch,
  closeModal,
  closing,
} = useFirstLaunch()

onMounted(() => {
  init()
  initFirstLaunch()
})

const onModalUpdate = (v: boolean) => {
  if (!v && !closing.value) {
    showModal.value = true
  }
}
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <UModal
      :open="showModal"
      :ui="{ overlay: 'bg-black/60' }"
      @update:open="onModalUpdate"
    >
      <template #content>
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <span class="text-lg font-bold">Первая обнова!</span>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="closeModal"
            />
          </div>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div
                class="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg bg-(--ui-primary-100)"
              >
                <UIcon
                  name="i-lucide-plus"
                  class="h-5 w-5 text-(--ui-primary)"
                />
              </div>
              <div>
                <p class="font-semibold text-sm">Заметки для пар</p>
                <p class="text-sm text-(--ui-text-muted)">
                  Теперь можно писать заметки к любому занятию. Они видны только
                  вам.
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div
                class="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg bg-(--ui-primary-100)"
              >
                <UIcon
                  name="i-lucide-file-text"
                  class="h-5 w-5 text-(--ui-primary)"
                />
              </div>
              <div>
                <p class="font-semibold text-sm">Календарь заметок</p>
                <p class="text-sm text-(--ui-text-muted)">
                  Все свои заметки можно просматривать по месяцам в отдельном
                  разделе меню.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </UApp>
</template>
