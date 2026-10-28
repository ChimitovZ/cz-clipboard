const fs = require('node:fs')
const db = require('./db')
const settings = require('./settings')
const { dropFiles } = require('./clipboard-watch')
const logger = require('./logger')

function run() {
  const days = settings.get().retentionDays
  if (!days) return 0
  const rows = db.expired(days)
  for (const it of rows) {
    dropFiles(it)
    db.remove(it.id)
  }
  if (rows.length) logger.info('cleanup ' + rows.length)
  return rows.length
}

function startHourly() {
  run()
  setInterval(run, 3600000)
}

module.exports = { run, startHourly, dropFiles }
