import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  trimVideo: (inputPath: string, outputPath: string, startTime: number, endTime: number) => 
    ipcRenderer.invoke('video:trim', inputPath, outputPath, startTime, endTime),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  onProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('video:progress', (_event, progress) => callback(progress))
  }
})