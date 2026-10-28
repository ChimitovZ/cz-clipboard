<script setup>
import { computed } from 'vue'
import { bytes } from '../lib/format'

const props = defineProps({ item: Object })
const emit = defineEmits(['action'])

const actions = computed(() => {
  const i = props.item
  if (!i) return []
  const a = []
  if (i.detected === 'url') a.push(['open', 'Открыть ссылку'])
  if (i.detected === 'json') a.push(['json', 'Формат JSON'])
  if (i.detected === 'color') {
    a.push(['hex', 'HEX'])
    a.push(['rgb', 'RGB'])
  }
  if (i.type === 'image') {
    a.push(['save', 'Сохранить'])
    a.push(['openimg', 'Просмотр'])
  }
  return a
})

function toRgb(c) {
  const t = c.trim()
  if (t.startsWith('#')) {
    let h = t.slice(1)
    if (h.length === 3) h = h.split('').map((x) => x + x).join('')
    const n = parseInt(h.slice(0, 6), 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
  }
  return t
}
function toHex(c) {
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return c
  const h = (n) => Number(n).toString(16).padStart(2, '0')
  return '#' + h(m[1]) + h(m[2]) + h(m[3])
}

async function run(id) {
  const i = props.item
  if (id === 'open') window.api.openUrl(i.text.trim())
  else if (id === 'json') window.api.copy({ id: i.id, transform: 'json' })
  else if (id === 'hex') window.api.writeText(toHex(i.text.trim()))
  else if (id === 'rgb') window.api.writeText(toRgb(i.text.trim()))
  else if (id === 'save') window.api.saveImage(i.id)
  else if (id === 'openimg') window.api.openImage(i.id)
  emit('action', id)
}
</script>

<template>
  <div v-if="item" class="h-[132px] border-t border-white/10 p-2 flex gap-2">
    <div class="flex-1 min-w-0 overflow-auto text-[12px] whitespace-pre-wrap break-words">
      <img v-if="item.imageData || item.thumbData" :src="item.imageData || item.thumbData" class="max-h-24 max-w-full object-contain mb-1" />
      <template v-else>{{ item.text }}</template>
    </div>
    <div class="w-[118px] shrink-0 flex flex-col gap-1 text-[11px] text-white/60">
      <div>{{ item.app_name || 'неизвестно' }}</div>
      <div class="truncate" :title="item.window_title">{{ item.window_title }}</div>
      <div>{{ bytes(item.size_bytes) }}</div>
      <button
        v-for="[id, label] in actions"
        :key="id"
        class="text-left text-accent hover:underline"
        @click="run(id)"
      >{{ label }}</button>
    </div>
  </div>
</template>
