const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const watch = require('./clipboard-watch')

let tray

function icon() {
  const p = path.join(__dirname, '..', 'assets', 'icon.png')
  if (fs.existsSync(p)) return nativeImage.createFromPath(p).resize({ width: 16, height: 16 })
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAaUlEQVR4nO2VwQkAIAwDs/9O3cC+4hMUqYgQ7gNvDUkaAQD4M8xsZ+Z2ROxE5CAiW2Z2BbACcAJgZvYCcA9q3v1EzF4ishHRc+9XAN4ANiKyA3AA8ARwB3B3Z1sA4M8Q0QfQsgNQsgNQsgPwAVcQIhG1nS3FAAAAAElFTkSuQmCC'
  )
}

function build(showPopup, showSettings) {
  if (tray) tray.destroy()
  tray = new Tray(icon())
  tray.setToolTip('CZ Clipboard')
  const paused = watch.isPaused()
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Открыть', click: () => showPopup() },
    { label: paused ? 'Продолжить запись' : 'Пауза записи', click: () => { watch.setPaused(!watch.isPaused()); build(showPopup, showSettings) } },
    { label: 'Настройки', click: () => showSettings() },
    { type: 'separator' },
    { label: 'Выход', click: () => { app.exit(0) } }
  ]))
  tray.on('click', () => showPopup())
  return tray
}

module.exports = { build }
