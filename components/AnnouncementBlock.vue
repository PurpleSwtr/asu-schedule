<script setup lang="ts">
import type { Announcement } from "~/composables/useAnnouncements"

defineProps<{ announcement: Announcement }>()
</script>

<template>
  <div class="rounded-xl border border-(--ui-border) p-3">
    <p class="font-semibold text-sm">{{ announcement.title }}</p>
    <div v-if="announcement.items?.length" class="mt-3 space-y-3">
      <div
        v-for="item in announcement.items"
        :key="item.title"
        class="flex items-start gap-3"
      >
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
        >
          <UIcon :name="item.icon" class="h-5 w-5 text-(--ui-primary)" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium">{{ item.title }}</p>
          <p class="text-xs leading-relaxed text-(--ui-text-muted)">
            {{ item.message }}
          </p>
        </div>
      </div>
    </div>
    <div v-else class="mt-1 flex items-start gap-3">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--ui-color-primary-100)"
      >
        <UIcon
          :name="announcement.icon!"
          class="h-5 w-5 text-(--ui-primary)"
        />
      </div>
      <p class="text-sm text-(--ui-text-muted)">
        {{ announcement.message }}
      </p>
    </div>
  </div>
</template>