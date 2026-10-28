<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ item: Object })
const open = ref(false)
const tags = ref('')
const sep = ref('\n')
const customSep = ref('')

watch(() => props.item, (i) => {
  tags.value = i && i.tags ? i.tags.join(', ') : ''
}, { immediate: true })

const transforms = [
  ['upper', 'UPPER'],
  ['lower', 'lower'],
  ['title', 'Title'],
  ['trim', 'trim'],
  ['unwrap', 'без переносов'],
  ['spaces', 'пробелы'],
  ['json', 'JSON'],
  ['b64e', 'Base64 →'],
  ['b64d', 'Base64 ←'],
  ['urle', 'URL →'],
  ['urld', 'URL ←'],
  ['layout', 'раскладка']
]

async function saveTags() {
  const list = tags.value.split(',').map((s) => s.trim()).filter(Boolean)
  await window.api.setTags(props.item.id, list)
}

async function pasteT(name) {
  await window.api.paste({ id: props.item.id, transform: name })
}
</script>

<template>
  <div class="relative">
    <button class="w-6 h-6 rounded border border-white/15 text-white/70" @click="open = !open">+</button>
    <div v-if="open" class="absolute right-0 top-7 z-20 w-56 rounded-lg border border-white/10 bg-ink-800 p-2 shadow-xl">
      <div class="text-[10px] text-white/40 mb-1">Теги</div>
      <input v-model="tags" class="w-full bg-black/20 rounded px-1.5 py-1 mb-1" placeholder="работа, код" @keydown.enter="saveTags" />
      <button class="text-accent text-[11px] mb-1" @click="saveTags">Сохранить теги</button>
      <button class="text-[11px] mb-2 text-white/70" @click="window.api.toggle(item.id, 'favorite')">Избранное</button>
      <div class="text-[10px] text-white/40 mb-1">Перед вставкой</div>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="[id, l] in transforms"
          :key="id"
          class="px-1.5 py-0.5 rounded bg-white/5 text-[10px] hover:bg-white/10"
          @click="pasteT(id)"
        >{{ l }}</button>
      </div>
    </div>
  </div>
</template>
