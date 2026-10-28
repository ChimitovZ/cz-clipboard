<script setup>
import { onMounted, ref } from 'vue'

const list = ref([])
const form = ref({ name: '', shortcut: '', body: '' })

async function load() { list.value = await window.api.snippets() }
async function save() {
  if (!form.value.name || !form.value.body) return
  list.value = await window.api.saveSnippet({ ...form.value })
  form.value = { name: '', shortcut: '', body: '' }
}
async function del(id) { list.value = await window.api.deleteSnippet(id) }
async function paste(id) { await window.api.pasteSnippet(id) }

onMounted(load)
</script>

<template>
  <div class="h-full overflow-y-auto p-3 space-y-2">
    <h2 class="text-sm font-semibold">Сниппеты</h2>
    <input v-model="form.name" class="w-full h-7 bg-black/25 rounded px-2" placeholder="Название" />
    <input v-model="form.shortcut" class="w-full h-7 bg-black/25 rounded px-2" placeholder="Сокращение" />
    <textarea v-model="form.body" rows="4" class="w-full bg-black/25 rounded px-2 py-1" placeholder="Текст" />
    <button class="px-2 h-7 rounded bg-accent" @click="save">Добавить</button>
    <div v-for="s in list" :key="s.id" class="rounded border border-white/10 p-2 flex items-start gap-2">
      <div class="flex-1 min-w-0">
        <div class="font-medium truncate">{{ s.name }} <span class="text-white/40">{{ s.shortcut }}</span></div>
        <div class="text-[11px] text-white/50 truncate">{{ s.body }}</div>
      </div>
      <button class="text-accent text-[11px]" @click="paste(s.id)">Вставить</button>
      <button class="text-red-400 text-[11px]" @click="del(s.id)">×</button>
    </div>
  </div>
</template>
