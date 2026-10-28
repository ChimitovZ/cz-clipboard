const { clipboard, nativeImage, BrowserWindow } = require('electron')
const fs = require('node:fs')
const win32 = require('./win32')
const cryptoStore = require('./crypto-store')
const { apply } = require('./transforms')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function writeItem(item, { plain, transform } = {}) {
  cryptoStore.unwrap(item)
  let text = item.text || ''
  if (transform) text = apply(transform, text)
  if (item.type === 'image' && item.image_path && !plain) {
    const img = nativeImage.createFromPath(item.image_path)
    clipboard.writeImage(img)
    return
  }
  if (item.type === 'files' && item.files_json && !plain) {
    clipboard.writeText(JSON.parse(item.files_json).join('\n'))
    return
  }
  if (plain) {
    clipboard.writeText(text)
    return
  }
  const payload = { text }
  if (item.html) payload.html = item.html
  if (item.rtf) payload.rtf = item.rtf
  clipboard.write(payload)
}

async function insert(item, opts, savedHwnd) {
  const wins = BrowserWindow.getAllWindows()
  for (const w of wins) w.hide()
  await sleep(40)
  if (savedHwnd) await win32.focusHwnd(savedHwnd)
  await sleep(80)
  writeItem(item, opts)
  await sleep(50)
  await win32.sendPaste()
}

function copyOnly(item, opts) {
  writeItem(item, opts)
}

function saveImageAs(item, dest) {
  if (!item.image_path) return false
  fs.copyFileSync(item.image_path, dest)
  return true
}

module.exports = { insert, copyOnly, saveImageAs, writeItem }
