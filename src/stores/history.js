import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dayLabel } from '../lib/format'

export const useHistory = defineStore('history', () => {
  const rows = ref([])
  const total = ref(0)
  const query = ref('')
  const filter = ref('all')
  const appFilter = ref('')
  const selected = ref(null)
  const picked = ref([])
  const loading = ref(false)

  async function refresh() {
    loading.value = true
    const res = await window.api.list({
      query: query.value,
      filter: filter.value,
      app: appFilter.value,
      offset: 0,
      limit: 400
    })
    rows.value = res.rows
    total.value = res.total
    if (selected.value) {
      const found = rows.value.find((r) => r.id === selected.value.id)
      selected.value = found || rows.value[0] || null
    } else selected.value = rows.value[0] || null
    loading.value = false
  }

  function groups() {
    const out = []
    let last = ''
    for (const item of rows.value) {
      const label = item.pinned ? 'Закреплённые' : dayLabel(item.updated_at)
      if (label !== last) {
        out.push({ kind: 'header', key: 'h-' + label, label })
        last = label
      }
      out.push({ kind: 'item', key: 'i-' + item.id, item })
    }
    return out
  }

  async function select(item, { add } = {}) {
    if (add) {
      const i = picked.value.indexOf(item.id)
      if (i >= 0) picked.value = picked.value.filter((x) => x !== item.id)
      else picked.value = [...picked.value, item.id]
    } else picked.value = []
    selected.value = item ? (await window.api.get(item.id) || item) : null
  }

  return { rows, total, query, filter, appFilter, selected, picked, loading, refresh, groups, select }
})
