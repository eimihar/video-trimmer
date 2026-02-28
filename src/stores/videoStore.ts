import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface VideoItem {
  id: string
  name: string
  path: string
  duration: number
}

export const useVideoStore = defineStore('video', () => {
  const videos = ref<VideoItem[]>([])
  const selectedVideoId = ref<string | null>(null)
  const trimStart = ref<number>(0)
  const trimEnd = ref<number>(0)
  const isProcessing = ref<boolean>(false)
  const status = ref<string>('Ready')
  const progress = ref<number>(0)

  const selectedVideo = computed(() => {
    return videos.value.find(v => v.id === selectedVideoId.value) || null
  })

  const trimDuration = computed(() => {
    return trimEnd.value - trimStart.value
  })

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function addVideo(name: string, path: string, duration: number = 0) {
    const video: VideoItem = {
      id: generateId(),
      name,
      path,
      duration
    }
    videos.value.push(video)
    if (!selectedVideoId.value) {
      selectVideo(video.id)
    }
  }

  function removeVideo(id: string) {
    const index = videos.value.findIndex(v => v.id === id)
    if (index !== -1) {
      videos.value.splice(index, 1)
      if (selectedVideoId.value === id) {
        selectedVideoId.value = videos.value.length > 0 ? videos.value[0].id : null
      }
    }
  }

  function selectVideo(id: string) {
    selectedVideoId.value = id
    const video = videos.value.find(v => v.id === id)
    if (video) {
      trimStart.value = 0
      trimEnd.value = video.duration
    }
  }

  function setTrimRange(start: number, end: number) {
    trimStart.value = start
    trimEnd.value = end
  }

  function updateVideoDuration(id: string, duration: number) {
    const video = videos.value.find(v => v.id === id)
    if (video) {
      video.duration = duration
      if (id === selectedVideoId.value) {
        trimEnd.value = duration
      }
    }
  }

  async function trimVideo(): Promise<{ success: boolean; error?: string }> {
    if (!selectedVideo.value) {
      return { success: false, error: 'No video selected' }
    }

    if (trimStart.value >= trimEnd.value) {
      return { success: false, error: 'End time must be greater than start time' }
    }

    isProcessing.value = true
    status.value = 'Processing...'
    progress.value = 0

    try {
      const inputPath = selectedVideo.value.path
      const ext = inputPath.split('.').pop() || 'mp4'
      const basePath = inputPath.substring(0, inputPath.lastIndexOf('.'))
      const outputPath = `${basePath}_trimmed.${ext}`

      const result = await window.electronAPI.trimVideo(
        inputPath,
        outputPath,
        trimStart.value,
        trimEnd.value
      )

      if (result.success) {
        status.value = 'Done'
      } else {
        status.value = 'Error'
      }

      return result
    } catch (error) {
      status.value = 'Error'
      return { success: false, error: String(error) }
    } finally {
      isProcessing.value = false
    }
  }

  function setStatus(newStatus: string) {
    status.value = newStatus
  }

  return {
    videos,
    selectedVideoId,
    selectedVideo,
    trimStart,
    trimEnd,
    trimDuration,
    isProcessing,
    status,
    progress,
    addVideo,
    removeVideo,
    selectVideo,
    setTrimRange,
    updateVideoDuration,
    trimVideo,
    setStatus
  }
})