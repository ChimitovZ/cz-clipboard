<script setup>
import { onMounted } from 'vue'
import { useApp } from './stores/app'
import HistoryView from './components/HistoryView.vue'
import SettingsView from './components/SettingsView.vue'
import SnippetsView from './components/SnippetsView.vue'
import StatsView from './components/StatsView.vue'

const app = useApp()
const tabs = [
  ['history', 'История'],
  ['snippets', 'Сниппеты'],
  ['stats', 'Статистика'],
  ['settings', 'Настройки']
]

onMounted(async () => {
  if (location.hash.replace('#', '')) app.view = location.hash.replace('#', '')
  await app.load()
})

async function togglePause() {
  app.paused = await window.api.setPaused(!app.paused)
}
</script>

<template>
  <div class="h-full flex flex-col bg-ink-900 text-ink-50 dark:bg-ink-900">
    <header class="h-8 px-2 flex items-center gap-1 border-b border-white/10 drag">
      <span class="text-[11px] font-semibold tracking-wide mr-auto">CZ Clipboard</span>
      <button
        class="h-6 px-1.5 rounded text-[11px]"
        :class="app.paused ? 'bg-amber-500/30 text-amber-200' : 'text-white/50'"
        @click="togglePause"
      >{{ app.paused ? 'Пауза' : 'Запись' }}</button>
      <button
        v-for="[id, l] in tabs"
        :key="id"
        class="h-6 px-1.5 rounded text-[11px]"
        :class="app.view === id ? 'bg-white/10' : 'text-white/50 hover:text-white'"
        @click="app.view = id"
      >{{ l }}</button>
    </header>
    <main class="flex-1 min-h-0">
      <HistoryView v-if="app.view === 'history'" />
      <SnippetsView v-else-if="app.view === 'snippets'" />
      <StatsView v-else-if="app.view === 'stats'" />
      <SettingsView v-else />
    </main>
  </div>
</template>
