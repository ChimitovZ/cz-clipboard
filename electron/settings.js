const fs = require('node:fs')
const logger = require('./logger')

const DEFAULTS = {
  retentionDays: 30,
  maxItemBytes: 20 * 1024 * 1024,
  maxStoreBytes: 0,
  pollMs: 400,
  hotkey: 'CommandOrControl+Shift+V',
  startWithWindows: false,
  paused: false,
  theme: 'system',
  ignorePasswordLike: true,
  blacklistApps: ['KeePass', 'KeePassXC', '1Password', 'Bitwarden', 'Dashlane', 'LastPass', 'KeePassXC-2'],
  encrypt: false,
  logLevel: 'info',
  popupPosition: 'cursor',
  ocrEnabled: true
}

let file = null
let data = { ...DEFAULTS }

function load(settingsPath) {
  file = settingsPath
  try {
    if (fs.existsSync(file)) Object.assign(data, JSON.parse(fs.readFileSync(file, 'utf8')))
  } catch (e) {
    logger.warn('settings load', e)
  }
  return get()
}

function get() {
  return { ...data, blacklistApps: [...(data.blacklistApps || [])] }
}

function set(patch) {
  Object.assign(data, patch)
  save()
  return get()
}

function save() {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)) } catch (e) { logger.error('settings save', e) }
}

module.exports = { DEFAULTS, load, get, set }
