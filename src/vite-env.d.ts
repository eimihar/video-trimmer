/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    openFileDialog: () => Promise<string[] | null>
    trimVideo: (inputPath: string, outputPath: string, startTime: number, endTime: number) => Promise<{ success: boolean; error?: string }>
    getPath: (name: string) => Promise<string>
    onProgress: (callback: (progress: number) => void) => void
  }
}