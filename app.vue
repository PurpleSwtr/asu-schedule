<script setup lang="ts">
const { init } = useAccentColor()
const { init: initFirstLaunch } = useFirstLaunch()

onMounted(() => {
  init()
  initFirstLaunch()
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <AnnouncementCenter />
  </UApp>
</template>