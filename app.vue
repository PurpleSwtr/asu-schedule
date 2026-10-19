<script setup lang="ts">
const { init } = useAccentColor()
const { init: initUiCustomization } = useUiCustomization()
const { init: initFirstLaunch } = useFirstLaunch()
const { init: initAppSettings, confettiOnLaunch } = useAppSettings()
const { init: initBadgeColors } = useBadgeColors()
const { fire } = useConfetti()
const { baseURL } = useRuntimeConfig().app

onMounted(() => {
  init()
  initUiCustomization()
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

useHead({
  link: [{ rel: "icon", type: "image/x-icon", href: `${baseURL}favicon.ico` }],
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <AnnouncementCenter />
  </UApp>
</template>
