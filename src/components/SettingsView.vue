<script setup>
import { onMounted, ref } from 'vue'
import { useApp } from '../stores/app'

const app = useApp()
const black = ref('')
const msg = ref('')

onMounted(async () => {
  await app.load()
  black.value = (app.settings.blacklistApps || []).join(', ')
})

async function save() {
  await app.patch({
    ...pick(),
    blacklistApps: black.value.split(',').map((s) => s.trim()).filter(Boolean)
  })
  msg.value = 'Сохранено'
  setTimeout(() => { msg.value = '' }, 1200)
}

function pick() {
  const s = app.settings
  return {
    retentionDays: +s.retentionDays,
    maxItemBytes: +s.maxItemBytes,
    maxStoreBytes: +s.maxStoreBytes,
    pollMs: +s.pollMs,
    hotkey: s.hotkey,
    startWithWindows: !!s.startWithWindows,
    theme: s.theme,
    ignorePasswordLike: !!s.ignorePasswordLike,
    encrypt: !!s.encrypt,
    logLevel: s.logLevel,
    popupPosition: s.popupPosition,
    ocrEnabled: !!s.ocrEnabled
  }
}

async function exp() { msg.value = await window.api.exportHistory() || '' }
async function imp() { msg.value = 'импорт: ' + (await window.api.importHistory()) }
async function bak() { msg.value = await window.api.quickBackup() }
async function wipe() {
  if (confirm('Очистить историю кроме закреплённых?')) {
    await window.api.clear()
    msg.value = 'Очищено'
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto p-3 space-y-3 text-[12px]">
    <h2 class="text-sm font-semibold">Настройки</h2>
    <label class="block">Тема
      <select v-model="app.settings.theme" class="w-full h-7 bg-black/25 rounded mt-0.5">
        <option value="system">Как в системе</option>
        <option value="dark">Тёмная</option>
        <option value="light">Светлая</option>
      </select>
    </label>
    <label class="block">Хранение
      <select v-model.number="app.settings.retentionDays" class="w-full h-7 bg-black/25 rounded mt-0.5">
        <option :value="7">7 дней</option>
        <option :value="30">30 дней</option>
        <option :value="90">90 дней</option>
        <option :value="0">Бессрочно</option>
      </select>
    </label>
    <label class="block">Макс. размер записи (байт)
      <input v-model.number="app.settings.maxItemBytes" type="number" class="w-full h-7 bg-black/25 rounded px-2 mt-0.5" />
    </label>
    <label class="block">Лимит хранилища (0 = нет)
      <input v-model.number="app.settings.maxStoreBytes" type="number" class="w-full h-7 bg-black/25 rounded px-2 mt-0.5" />
    </label>
    <label class="block">Хоткей
      <input v-model="app.settings.hotkey" class="w-full h-7 bg-black/25 rounded px-2 mt-0.5" />
    </label>
    <label class="block">Позиция окна
      <select v-model="app.settings.popupPosition" class="w-full h-7 bg-black/25 rounded mt-0.5">
        <option value="cursor">У курсора</option>
        <option value="center">По центру</option>
      </select>
    </label>
    <label class="flex items-center gap-2"><input v-model="app.settings.startWithWindows" type="checkbox" /> Запуск с Windows</label>
    <label class="flex items-center gap-2"><input v-model="app.settings.ignorePasswordLike" type="checkbox" /> Не сохранять пароли и карты</label>
    <label class="flex items-center gap-2"><input v-model="app.settings.encrypt" type="checkbox" :disabled="!app.settings.encryptAvailable" /> Шифровать поля (DPAPI)</label>
    <label class="flex items-center gap-2"><input v-model="app.settings.ocrEnabled" type="checkbox" /> OCR (нужны rus+eng в tessdata)</label>
    <div class="text-[11px] text-white/40">OCR файлы: {{ app.settings.ocrReady ? 'найдены' : 'нет traineddata' }}</div>
    <label class="block">Чёрный список приложений
      <input v-model="black" class="w-full h-7 bg-black/25 rounded px-2 mt-0.5" />
    </label>
    <label class="block">Логи
      <select v-model="app.settings.logLevel" class="w-full h-7 bg-black/25 rounded mt-0.5">
        <option>error</option><option>warn</option><option>info</option><option>debug</option>
      </select>
    </label>
    <div class="flex flex-wrap gap-1">
      <button class="px-2 h-7 rounded bg-accent text-white" @click="save">Сохранить</button>
      <button class="px-2 h-7 rounded bg-white/10" @click="exp">Экспорт</button>
      <button class="px-2 h-7 rounded bg-white/10" @click="imp">Импорт</button>
      <button class="px-2 h-7 rounded bg-white/10" @click="bak">Резервная копия</button>
      <button class="px-2 h-7 rounded bg-red-500/80 text-white" @click="wipe">Очистить историю</button>
    </div>
    <p v-if="msg" class="text-accent text-[11px] break-all">{{ msg }}</p>
  </div>
</template>
