const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  list: (opts) => ipcRenderer.invoke('items:list', opts),
  get: (id) => ipcRenderer.invoke('items:get', id),
  remove: (id) => ipcRenderer.invoke('items:delete', id),
  toggle: (id, field) => ipcRenderer.invoke('items:toggle', { id, field }),
  setTags: (id, tags) => ipcRenderer.invoke('items:tags', { id, tags }),
  clear: () => ipcRenderer.invoke('items:clear'),
  paste: (opts) => ipcRenderer.invoke('items:paste', opts),
  copy: (opts) => ipcRenderer.invoke('items:copy', opts),
  saveImage: (id) => ipcRenderer.invoke('items:save-image', id),
  openImage: (id) => ipcRenderer.invoke('items:open-image', id),
  openUrl: (url) => ipcRenderer.invoke('items:open-url', url),
  stats: () => ipcRenderer.invoke('items:stats'),
  apps: () => ipcRenderer.invoke('items:apps'),
  transform: (name, text) => ipcRenderer.invoke('transform', { name, text }),
  writeText: (text) => ipcRenderer.invoke('clip:write-text', text),
  settings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (p) => ipcRenderer.invoke('settings:set', p),
  paused: () => ipcRenderer.invoke('pause:get'),
  setPaused: (v) => ipcRenderer.invoke('pause:set', v),
  hide: () => ipcRenderer.invoke('window:hide'),
  snippets: () => ipcRenderer.invoke('snippets:list'),
  saveSnippet: (s) => ipcRenderer.invoke('snippets:save', s),
  deleteSnippet: (id) => ipcRenderer.invoke('snippets:delete', id),
  pasteSnippet: (id) => ipcRenderer.invoke('snippets:paste', id),
  exportHistory: () => ipcRenderer.invoke('backup:export'),
  importHistory: () => ipcRenderer.invoke('backup:import'),
  quickBackup: () => ipcRenderer.invoke('backup:quick'),
  cleanupNow: () => ipcRenderer.invoke('cleanup:now'),
  onChanged: (cb) => {
    const fn = () => cb()
    ipcRenderer.on('items:changed', fn)
    return () => ipcRenderer.removeListener('items:changed', fn)
  }
})
