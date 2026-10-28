const { ipcMain, dialog, shell, app, clipboard } = require('electron')
const db = require('./db')
const watch = require('./clipboard-watch')
const paste = require('./paste')
const settings = require('./settings')
const cryptoStore = require('./crypto-store')
const backup = require('./backup')
const { apply } = require('./transforms')
const hotkeys = require('./hotkeys')
const state = require('./state')
const ocr = require('./ocr')
const { run: cleanupRun } = require('./cleanup')
const logger = require('./logger')
const fs = require('node:fs')

function dataUrl(p) {
  if (!p || !fs.existsSync(p)) return null
  return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64')
}

function unwrapRows(rows) {
  return rows.map((r) => {
    const x = cryptoStore.unwrap({ ...r })
    x.thumbData = dataUrl(x.thumb_path)
    return x
  })
}

function broadcast() {
  const { BrowserWindow } = require('electron')
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('items:changed')
}

function bind() {
  ipcMain.handle('items:list', (_e, opts) => {
    const res = db.list(opts || {})
    res.rows = unwrapRows(res.rows)
    return res
  })
  ipcMain.handle('items:get', (_e, id) => {
    const x = cryptoStore.unwrap(db.get(id))
    if (!x) return null
    x.thumbData = dataUrl(x.thumb_path)
    if (x.image_path && x.size_bytes < 8 * 1024 * 1024) x.imageData = dataUrl(x.image_path)
    return x
  })
  ipcMain.handle('items:delete', (_e, id) => {
    const it = db.remove(id)
    if (it) require('./clipboard-watch').dropFiles(it)
    broadcast()
    return true
  })
  ipcMain.handle('items:toggle', (_e, { id, field }) => {
    const r = db.toggle(id, field === 'favorite' ? 'favorite' : 'pinned')
    broadcast()
    return cryptoStore.unwrap(r)
  })
  ipcMain.handle('items:tags', (_e, { id, tags }) => cryptoStore.unwrap(db.setTags(id, tags)))
  ipcMain.handle('items:clear', () => {
    const rows = db.clearUnpinned()
    for (const it of rows) require('./clipboard-watch').dropFiles(it)
    broadcast()
    return true
  })
  ipcMain.handle('items:paste', async (_e, { id, plain, transform, ids, separator }) => {
    if (ids && ids.length > 1) {
      const parts = ids.map((i) => {
        const it = cryptoStore.unwrap(db.get(i))
        return it && it.text || ''
      })
      const text = parts.join(separator == null ? '\n' : separator)
      const fake = { type: 'text', text }
      await paste.insert(fake, { plain: true }, state.savedHwnd)
      return true
    }
    const item = cryptoStore.unwrap(db.get(id))
    if (!item) return false
    await paste.insert(item, { plain, transform }, state.savedHwnd)
    return true
  })
  ipcMain.handle('items:copy', (_e, { id, plain, transform }) => {
    const item = cryptoStore.unwrap(db.get(id))
    if (!item) return false
    paste.copyOnly(item, { plain, transform })
    return true
  })
  ipcMain.handle('items:save-image', async (_e, id) => {
    const item = db.get(id)
    if (!item || !item.image_path) return false
    const res = await dialog.showSaveDialog({ defaultPath: 'clip.png', filters: [{ name: 'PNG', extensions: ['png'] }] })
    if (res.canceled || !res.filePath) return false
    return paste.saveImageAs(item, res.filePath)
  })
  ipcMain.handle('items:open-image', (_e, id) => {
    const item = db.get(id)
    if (item && item.image_path) shell.openPath(item.image_path)
  })
  ipcMain.handle('items:open-url', (_e, url) => { if (url) shell.openExternal(url) })
  ipcMain.handle('items:stats', () => db.stats())
  ipcMain.handle('items:apps', () => db.apps())
  ipcMain.handle('transform', (_e, { name, text }) => apply(name, text))
  ipcMain.handle('clip:write-text', (_e, text) => { clipboard.writeText(String(text || '')); return true })
  ipcMain.handle('settings:get', () => ({
    ...settings.get(),
    ocrReady: ocr.langsReady(),
    encryptAvailable: require('electron').safeStorage.isEncryptionAvailable()
  }))
  ipcMain.handle('settings:set', (_e, patch) => {
    const prev = settings.get()
    const next = settings.set(patch)
    if (patch.logLevel) logger.setLevel(patch.logLevel)
    if (patch.hotkey && patch.hotkey !== prev.hotkey) hotkeys.register()
    if (patch.startWithWindows != null) {
      app.setLoginItemSettings({ openAtLogin: !!patch.startWithWindows, path: process.execPath })
    }
    if (patch.pollMs && patch.pollMs !== prev.pollMs) watch.start(broadcast)
    return next
  })
  ipcMain.handle('pause:get', () => watch.isPaused())
  ipcMain.handle('pause:set', (_e, v) => {
    watch.setPaused(!!v)
    const tray = require('./tray')
    tray.build(
      () => require('./windows').showPopup(),
      () => require('./windows').createSettings()
    )
    return watch.isPaused()
  })
  ipcMain.handle('window:hide', (e) => {
    const w = require('electron').BrowserWindow.fromWebContents(e.sender)
    if (w) w.hide()
  })
  ipcMain.handle('snippets:list', () => db.snippets())
  ipcMain.handle('snippets:save', (_e, s) => { db.saveSnippet(s); return db.snippets() })
  ipcMain.handle('snippets:delete', (_e, id) => { db.deleteSnippet(id); return db.snippets() })
  ipcMain.handle('snippets:paste', async (_e, id) => {
    const s = db.snippets().find((x) => x.id === id)
    if (!s) return false
    await paste.insert({ type: 'text', text: s.body }, { plain: true }, state.savedHwnd)
    return true
  })
  ipcMain.handle('backup:export', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    if (res.canceled || !res.filePaths[0]) return null
    return backup.exportAll(res.filePaths[0])
  })
  ipcMain.handle('backup:import', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (res.canceled || !res.filePaths[0]) return 0
    const n = backup.importAll(res.filePaths[0])
    broadcast()
    return n
  })
  ipcMain.handle('backup:quick', () => backup.quickBackup())
  ipcMain.handle('cleanup:now', () => cleanupRun())
  ipcMain.handle('file:exists', (_e, p) => !!(p && fs.existsSync(p)))
}

module.exports = { bind, broadcast }
