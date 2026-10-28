<script setup>
import { onMounted, ref } from 'vue'
import { bytes } from '../lib/format'

const s = ref(null)
onMounted(async () => { s.value = await window.api.stats() })
</script>

<template>
  <div v-if="s" class="h-full overflow-y-auto p-3 space-y-2 text-[12px]">
    <h2 class="text-sm font-semibold">Статистика</h2>
    <p>Записей: {{ s.total }} · закреплено: {{ s.pinned }}</p>
    <p>Место: {{ bytes(s.bytes) }}</p>
    <div>
      <div class="text-white/40 mb-1">По типам</div>
      <div v-for="t in s.byType" :key="t.type">{{ t.type }}: {{ t.c }}</div>
    </div>
    <div>
      <div class="text-white/40 mb-1">Топ приложений</div>
      <div v-for="a in s.apps" :key="a.app">{{ a.app }}: {{ a.c }}</div>
    </div>
  </div>
</template>
