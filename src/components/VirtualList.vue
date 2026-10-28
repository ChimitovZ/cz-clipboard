<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  heightOf: { type: Function, required: true }
})

const root = ref(null)
const top = ref(0)

const offsets = computed(() => {
  const o = [0]
  let y = 0
  for (const it of props.items) {
    y += props.heightOf(it)
    o.push(y)
  }
  return o
})

const total = computed(() => offsets.value[offsets.value.length - 1] || 0)

const visible = computed(() => {
  const h = root.value ? root.value.clientHeight : 560
  const t = top.value
  let i = 0
  while (i < offsets.value.length - 1 && offsets.value[i + 1] < t - 40) i++
  const start = i
  while (i < props.items.length && offsets.value[i] < t + h + 80) i++
  return props.items.slice(start, i).map((item, k) => ({
    item,
    y: offsets.value[start + k],
    h: props.heightOf(item)
  }))
})

function onScroll(e) {
  top.value = e.target.scrollTop
}
</script>

<template>
  <div ref="root" class="h-full overflow-y-auto" @scroll="onScroll">
    <div class="relative" :style="{ height: total + 'px' }">
      <div
        v-for="v in visible"
        :key="v.item.key"
        class="absolute left-0 right-0"
        :style="{ top: v.y + 'px', height: v.h + 'px' }"
      >
        <slot :item="v.item" />
      </div>
    </div>
  </div>
</template>
