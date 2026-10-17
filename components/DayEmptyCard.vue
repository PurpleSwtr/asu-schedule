<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    active?: boolean
    variant?: "weekend" | "none"
  }>(),
  { variant: "none" },
)

const shown = useReveal(() => props.active)
</script>

<template>
  <Motion
    :initial="false"
    :animate="
      shown
        ? { opacity: 1, y: 0, scale: 1 }
        : { opacity: 0, y: 24, scale: 0.96 }
    "
    :transition="
      shown
        ? { type: 'spring', stiffness: 260, damping: 22 }
        : { duration: 0 }
    "
  >
    <UCard v-if="variant === 'weekend'" class="py-6 pt-10 text-center">
      <Motion
        as="div"
        class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-(--ui-color-primary-100)"
        :initial="false"
        :animate="
          shown
            ? { scale: [0.4, 1.15, 1], opacity: 1 }
            : { scale: 0.4, opacity: 0 }
        "
        :transition="{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }"
      >
        <Motion
          as="span"
          class="flex items-center justify-center"
          :initial="false"
          :animate="
            shown
              ? { scale: [0, 1.25, 1], rotate: [-35, 8, 0], opacity: 1 }
              : { scale: 0, rotate: -35, opacity: 0 }
          "
          :transition="{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.12 }"
        >
          <UIcon
            name="i-lucide-party-popper"
            class="h-7 w-7 text-(--ui-primary)"
          />
        </Motion>
      </Motion>
      <p class="text-lg font-semibold text-(--ui-text)">Выходной!</p>
      <p class="text-sm text-(--ui-text-muted) mt-1">
        Отдыхайте и набирайтесь сил.
      </p>
      <p class="text-xs text-(--ui-text-muted) mt-5">
        ( А то сессия скоро, так-то )
      </p>
    </UCard>

    <UCard v-else class="py-8 pt-10 text-center">
      <Motion
        as="span"
        class="mx-auto mb-2 flex h-6 w-6 items-center justify-center"
        :animate="{ y: [0, -4, 0] }"
        :transition="{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }"
      >
        <UIcon
          name="i-lucide-calendar-x"
          class="h-6 w-6 text-(--ui-text-muted)"
        />
      </Motion>
      <p class="text-(--ui-text-muted)">В этот день пар нет</p>
    </UCard>
  </Motion>
</template>
