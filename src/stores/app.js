import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useApp = defineStore('app', () => {
  const view = ref(location.hash.replace('#', '') || 'history')
  const theme = ref('system')
  const paused = ref(false)
  const settings = ref({})

  function applyTheme(mode) {
    theme.value = mode
    const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }

  async function load() {
    settings.value = await window.api.settings()
    paused.value = await window.api.paused()
    applyTheme(settings.value.theme || 'system')
  }

  async function patch(p) {
    settings.value = await window.api.setSettings(p)
    if (p.theme) applyTheme(p.theme)
  }

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'system') applyTheme('system')
  })

  watch(view, (v) => {
    if (location.hash.replace('#', '') !== v) location.hash = v === 'history' ? '' : v
  })

  return { view, theme, paused, settings, load, patch, applyTheme }
})
