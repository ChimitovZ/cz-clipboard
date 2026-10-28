const { BrowserWindow, screen, app } = require('electron')
const path = require('node:path')
const settings = require('./settings')
const state = require('./state')

const isDev = !app.isPackaged

function pageUrl(hash) {
  if (isDev) return 'http://127.0.0.1:5173/' + (hash || '')
  return path.join(app.getAppPath(), 'dist', 'index.html')
}

function load(win, hash) {
  if (isDev) win.loadURL(pageUrl(hash))
  else win.loadFile(pageUrl(), { hash: (hash || '').replace(/^#/, '') })
}

function createPopup() {
  const win = new BrowserWindow({
    width: 440,
    height: 560,
    show: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#12171f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })
  win.on('blur', () => { if (!win.webContents.isDevToolsOpened()) win.hide() })
  load(win, '')
  state.popup = win
  return win
}

function placePopup(win) {
  const mode = settings.get().popupPosition
  const cursor = screen.getCursorScreenPoint()
  const disp = screen.getDisplayNearestPoint(cursor)
  const { width, height } = win.getBounds()
  const wa = disp.workArea
  let x, y
  if (mode === 'center') {
    x = wa.x + Math.round((wa.width - width) / 2)
    y = wa.y + Math.round((wa.height - height) / 2)
  } else {
    x = cursor.x + 8
    y = cursor.y + 8
    if (x + width > wa.x + wa.width) x = wa.x + wa.width - width - 8
    if (y + height > wa.y + wa.height) y = wa.y + wa.height - height - 8
    if (x < wa.x) x = wa.x + 8
    if (y < wa.y) y = wa.y + 8
  }
  win.setPosition(Math.round(x), Math.round(y))
}

function showPopup() {
  const win = state.popup
  if (!win) return
  placePopup(win)
  win.show()
  win.focus()
}

function createSettings() {
  if (state.settingsWin && !state.settingsWin.isDestroyed()) {
    state.settingsWin.show()
    state.settingsWin.focus()
    return state.settingsWin
  }
  const win = new BrowserWindow({
    width: 520,
    height: 620,
    show: true,
    autoHideMenuBar: true,
    backgroundColor: '#12171f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })
  load(win, '#settings')
  win.on('closed', () => { state.settingsWin = null })
  state.settingsWin = win
  return win
}

module.exports = { createPopup, showPopup, createSettings, load }
