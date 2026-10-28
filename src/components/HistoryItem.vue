<script setup>
import { computed } from 'vue'
import { previewText, timeShort, colorOf } from '../lib/format'

const props = defineProps({ item: Object, active: Boolean, checked: Boolean, index: Number })
const emit = defineEmits(['select', 'paste'])

const color = computed(() => colorOf(props.item))
const domain = computed(() => {
  if (props.item.detected !== 'url') return ''
  try { return new URL(props.item.text.trim()).hostname } catch { return '' }
})
</script>

<template>
  <button
    class="w-full h-[52px] px-2 flex items-center gap-2 text-left rounded-md transition-colors"
    :class="active ? 'bg-accent/20' : 'hover:bg-white/5'"
    @click="$emit('select', $event)"
    @dblclick="$emit('paste', false)"
  >
    <span v-if="index < 9" class="w-3 text-[10px] text-white/30 tabular-nums">{{ index + 1 }}</span>
    <span v-else class="w-3" />
    <span v-if="item.pinned" class="text-accent text-[10px]">📌</span>
    <span
      v-if="color"
      class="w-4 h-4 rounded-full border border-white/20 shrink-0"
      :style="{ background: color }"
    />
    <img v-else-if="item.thumbData" :src="item.thumbData" class="w-8 h-8 object-cover rounded shrink-0" />
    <span v-else class="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-[10px] text-white/50 shrink-0">
      {{ item.type === 'files' ? 'Ф' : item.detected === 'url' ? '↗' : 'T' }}
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate leading-4">{{ previewText(item) }}</span>
      <span class="block text-[10px] text-white/40 truncate">
        <template v-if="item.type === 'image'">{{ item.image_w }}×{{ item.image_h }}</template>
        <template v-else-if="domain">{{ domain }}</template>
        <template v-else>{{ item.char_count }} симв.</template>
        <template v-if="item.app_name"> · {{ item.app_name }}</template>
      </span>
    </span>
    <span class="text-[10px] text-white/30 tabular-nums">{{ timeShort(item.updated_at) }}</span>
  </button>
</template>
