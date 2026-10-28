export function timeShort(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function dayLabel(ts) {
  const d = new Date(ts)
  const now = new Date()
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = (a - b) / 86400000
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

export function bytes(n) {
  if (n < 1024) return n + ' Б'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' КБ'
  return (n / 1024 / 1024).toFixed(1) + ' МБ'
}

export function previewText(item) {
  const t = (item.text || '').replace(/\s+/g, ' ').trim()
  return t.slice(0, 140) || (item.type === 'image' ? 'Изображение' : 'Пусто')
}

export function colorOf(item) {
  if (item.detected !== 'color') return ''
  return (item.text || '').trim()
}
