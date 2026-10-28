const { globalShortcut } = require('electron')
const settings = require('./settings')
const logger = require('./logger')

let cb = () => {}

function register(onToggle) {
  if (onToggle) cb = onToggle
  globalShortcut.unregisterAll()
  const acc = settings.get().hotkey || 'CommandOrControl+Shift+V'
  const ok = globalShortcut.register(acc, () => cb())
  if (!ok) logger.warn('hotkey failed ' + acc)
  return ok
}

module.exports = { register }
