<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number
    stiffness?: number
    damping?: number
  }>(),
  { stiffness: 140, damping: 22 },
)

const display = ref(props.value)

const spring = useSpring(props.value, {
  stiffness: props.stiffness,
  damping: props.damping,
})

useMotionValueEvent(spring, 'change', (v: number) => {
  display.value = Math.round(v)
})

watch(
  () => props.value,
  (v) => {
    spring.value = v
  },
)
</script>

<template>
  <span>{{ display }}</span>
</template>
