const { safeStorage } = require('electron')
const settings = require('./settings')

function on() {
  return !!(settings.get().encrypt && safeStorage.isEncryptionAvailable())
}

function wrap(text) {
  if (!on() || text == null || text === '') return { value: text, encrypted: 0 }
  try {
    return { value: safeStorage.encryptString(String(text)).toString('base64'), encrypted: 1 }
  } catch {
    return { value: text, encrypted: 0 }
  }
}

function unwrap(item) {
  if (!item || !item.encrypted) return item
  const fields = ['text', 'html', 'rtf', 'ocr_text']
  for (const f of fields) {
    if (!item[f]) continue
    try { item[f] = safeStorage.decryptString(Buffer.from(item[f], 'base64')) } catch {}
  }
  return item
}

module.exports = { on, wrap, unwrap }
