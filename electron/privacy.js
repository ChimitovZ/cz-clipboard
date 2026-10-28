const { clipboard } = require('electron')
const { isPasswordLike, luhn } = require('./detect')
const settings = require('./settings')

const IGNORE_FORMATS = [
  'ExcludeClipboardContentFromMonitorProcessing',
  'CanIncludeInClipboardHistory',
  'ClipboardViewerIgnore'
]

function formatsSayIgnore() {
  try {
    const f = clipboard.availableFormats()
    if (f.includes('ExcludeClipboardContentFromMonitorProcessing')) return true
    if (f.some((x) => /ExcludeClipboard|ClipboardViewerIgnore/i.test(x))) return true
  } catch {}
  return false
}

function blockedApp(appName) {
  if (!appName) return false
  const list = settings.get().blacklistApps || []
  const n = appName.toLowerCase()
  return list.some((x) => n.includes(String(x).toLowerCase()))
}

function skipText(text) {
  if (!settings.get().ignorePasswordLike || !text) return false
  const t = text.trim()
  if (isPasswordLike(t)) return true
  const digits = t.replace(/\s|-/g, '')
  if (/^\d{13,19}$/.test(digits) && luhn(digits)) return true
  return false
}

module.exports = { formatsSayIgnore, blockedApp, skipText, IGNORE_FORMATS }
