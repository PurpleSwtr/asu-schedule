<script setup lang="ts">
const { init } = useAccentColor()
const { init: initFirstLaunch } = useFirstLaunch()
const { init: initAppSettings, confettiOnLaunch } = useAppSettings()
const { init: initBadgeColors } = useBadgeColors()
const { fire } = useConfetti()

onMounted(() => {
  init()
  initFirstLaunch()
  initAppSettings()
  initBadgeColors()

  if (
    confettiOnLaunch.value &&
    !sessionStorage.getItem("asu-confetti-session")
  ) {
    sessionStorage.setItem("asu-confetti-session", "1")
    setTimeout(
      () =>
        fire({
          emojis: ["🎉", "✨", "⭐"],
          emojiCount: 8,
          emojiSize: 56,
          colorCount: 30,
        }),
      700,
    )
  }
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <AnnouncementCenter />
  </UApp>
</template>