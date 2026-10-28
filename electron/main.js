const { app, Menu } = require('electron')
const paths = require('./paths')
const logger = require('./logger')
const settings = require('./settings')
const db = require('./db')
const watch = require('./clipboard-watch')
const cleanup = require('./cleanup')
const ipc = require('./ipc')
const tray = require('./tray')
const hotkeys = require('./hotkeys')
const windows = require('./windows')
const win32 = require('./win32')
const state = require('./state')

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => windows.showPopup())
}

app.setAppUserModelId('ru.cz.clipboard')
Menu.setApplicationMenu(null)

async function togglePopup() {
  const fg = await win32.foreground()
  const win = state.popup
  if (win && win.isVisible()) {
    win.hide()
    return
  }
  if (fg && fg.hwnd) state.savedHwnd = fg.hwnd
  watch.rememberSource(fg)
  windows.showPopup()
}

function boot() {
  const dirs = paths.ensureDirs()
  const cfg = settings.load(dirs.settings)
  logger.init(dirs.logs, cfg.logLevel)
  logger.rotate()
  logger.info('start')
  db.open(dirs.db)
  ipc.bind()
  windows.createPopup()
  tray.build(() => togglePopup(), () => windows.createSettings())
  hotkeys.register(() => togglePopup())
  watch.start(() => ipc.broadcast())
  cleanup.startHourly()
  app.setLoginItemSettings({ openAtLogin: !!cfg.startWithWindows, path: process.execPath })
}

app.whenReady().then(boot)

app.on('window-all-closed', () => {})

app.on('before-quit', () => {
  watch.stop()
})

app.on('will-quit', () => {
  const { globalShortcut } = require('electron')
  globalShortcut.unregisterAll()
})
