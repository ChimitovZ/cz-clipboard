<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useHistory } from '../stores/history'
import VirtualList from './VirtualList.vue'
import HistoryItem from './HistoryItem.vue'
import PreviewPane from './PreviewPane.vue'
import ExtraMenu from './ExtraMenu.vue'

const hist = useHistory()
const q = ref('')
const apps = ref([])
const sep = ref('nl')
const custom = ref('')
let t = null

const chips = [
  ['all', 'Всё'],
  ['text', 'Текст'],
  ['image', 'Картинки'],
  ['link', 'Ссылки'],
  ['files', 'Файлы'],
  ['pinned', 'Закреплённые'],
  ['favorite', 'Избранное']
]

const flat = computed(() => hist.groups())
function hOf(row) { return row.kind === 'header' ? 22 : 52 }

watch(q, (v) => {
  clearTimeout(t)
  t = setTimeout(() => { hist.query = v; hist.refresh() }, 120)
})

function idxOf(item) {
  return hist.rows.findIndex((r) => r.id === item.id)
}

async function paste(plain, transform) {
  const ids = hist.picked.length > 1 ? hist.picked : null
  const separator = sep.value === 'nl' ? '\n' : sep.value === 'comma' ? ', ' : custom.value
  await window.api.paste({
    id: hist.selected && hist.selected.id,
    plain,
    transform,
    ids,
    separator
  })
}

async function onKey(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    if (e.key === 'Escape') e.target.blur()
    return
  }
  const list = hist.rows
  const i = hist.selected ? list.findIndex((r) => r.id === hist.selected.id) : 0
  if (e.key === 'Escape') { window.api.hide(); return }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (list[i + 1]) hist.select(list[i + 1])
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (list[i - 1]) hist.select(list[i - 1])
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    await paste(e.shiftKey)
  }
  if (e.key === 'Delete' && hist.selected) {
    await window.api.remove(hist.selected.id)
    await hist.refresh()
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'p' && hist.selected) {
    e.preventDefault()
    await window.api.toggle(hist.selected.id, 'pinned')
    await hist.refresh()
  }
  if (e.ctrlKey && /^[1-9]$/.test(e.key)) {
    const n = +e.key - 1
    if (list[n]) {
      hist.select(list[n])
      await paste(false)
    }
  }
}

onMounted(async () => {
  await hist.refresh()
  apps.value = await window.api.apps()
  window.addEventListener('keydown', onKey)
  off = window.api.onChanged(() => hist.refresh())
})
let off = () => {}
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  off()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="p-2 pb-1 space-y-1">
      <input
        v-model="q"
        class="w-full h-7 rounded-md bg-black/25 px-2 outline-none border border-white/10 focus:border-accent"
        placeholder="Поиск"
        autofocus
      />
      <div class="flex gap-1 overflow-x-auto pb-0.5">
        <button
          v-for="[id, l] in chips"
          :key="id"
          class="chip"
          :class="hist.filter === id ? 'chip-on' : 'chip-off'"
          @click="hist.filter = id; hist.refresh()"
        >{{ l }}</button>
      </div>
      <div class="flex items-center gap-1">
        <select
          class="h-6 text-[11px] bg-black/25 rounded border border-white/10 flex-1"
          :value="hist.appFilter"
          @change="hist.appFilter = $event.target.value; hist.refresh()"
        >
          <option value="">Все приложения</option>
          <option v-for="a in apps" :key="a.app" :value="a.app">{{ a.app }}</option>
        </select>
        <ExtraMenu v-if="hist.selected" :item="hist.selected" />
      </div>
    </div>
    <div class="flex-1 min-h-0">
      <VirtualList :items="flat" :height-of="hOf">
        <template #default="{ item }">
          <div v-if="item.kind === 'header'" class="px-3 h-[22px] text-[10px] uppercase tracking-wide text-white/35 flex items-center">
            {{ item.label }}
          </div>
          <HistoryItem
            v-else
            :item="item.item"
            :active="hist.selected && hist.selected.id === item.item.id"
            :index="idxOf(item.item)"
            @select="hist.select(item.item, { add: $event.ctrlKey })"
            @paste="paste(false)"
          />
        </template>
      </VirtualList>
    </div>
    <div v-if="hist.picked.length > 1" class="px-2 py-1 flex items-center gap-1 text-[11px] border-t border-white/10">
      <span>{{ hist.picked.length }} выбрано</span>
      <select v-model="sep" class="bg-black/25 rounded h-6 text-[11px]">
        <option value="nl">перенос</option>
        <option value="comma">запятая</option>
        <option value="custom">свой</option>
      </select>
      <input v-if="sep === 'custom'" v-model="custom" class="w-16 h-6 bg-black/25 rounded px-1" />
      <button class="text-accent" @click="paste(true)">Вставить вместе</button>
    </div>
    <PreviewPane :item="hist.selected" />
  </div>
</template>
