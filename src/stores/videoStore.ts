import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface VideoItem {
  id: string
  name: string
  path: string
  duration: number
  trimStart: number
  trimEnd: number
  isInPlaylist: boolean
}

export type SortField = 'name' | 'duration' | 'date'
export type SortDirection = 'asc' | 'desc'

const STORAGE_KEY = 'trimmer_videos'

export const useVideoStore = defineStore('video', () => {
  const videos = ref<VideoItem[]>([])
  const selectedVideoId = ref<string | null>(null)
  const trimStart = ref<number>(0)
  const trimEnd = ref<number>(0)
  const isProcessing = ref<boolean>(false)
  const status = ref<string>('Ready')
  const progress = ref<number>(0)
  const sortField = ref<SortField>('date')
  const sortDirection = ref<SortDirection>('desc')

  const selectedVideo = computed(() => {
    return videos.value.find(v => v.id === selectedVideoId.value) || null
  })

  const playlist = computed(() => {
    return videos.value.filter(v => v.isInPlaylist)
  })

  const sortedPlaylist = computed(() => {
    const playlistVideos = [...playlist.value]
    
    playlistVideos.sort((a, b) => {
      let comparison = 0
      
      switch (sortField.value) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'duration':
          comparison = (a.trimEnd - a.trimStart) - (b.trimEnd - b.trimStart)
          break
        case 'date':
          comparison = parseInt(a.id) - parseInt(b.id)
          break
      }
      
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
    
    return playlistVideos
  })

  const trimDuration = computed(() => {
    return trimEnd.value - trimStart.value
  })

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as VideoItem[]
        videos.value = parsed
        if (parsed.length > 0 && !selectedVideoId.value) {
          selectVideo(parsed[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load videos from storage:', error)
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videos.value))
    } catch (error) {
      console.error('Failed to save videos to storage:', error)
    }
  }

  function addVideo(name: string, path: string, duration: number = 0) {
    const video: VideoItem = {
      id: generateId(),
      name,
      path,
      duration,
      trimStart: 0,
      trimEnd: duration,
      isInPlaylist: true
    }
    videos.value.push(video)
    if (!selectedVideoId.value) {
      selectVideo(video.id)
    }
    saveToStorage()
  }

  function removeVideo(id: string) {
    const index = videos.value.findIndex(v => v.id === id)
    if (index !== -1) {
      videos.value.splice(index, 1)
      if (selectedVideoId.value === id) {
        selectedVideoId.value = videos.value.length > 0 ? videos.value[0].id : null
      }
      saveToStorage()
    }
  }

  function selectVideo(id: string) {
    selectedVideoId.value = id
    const video = videos.value.find(v => v.id === id)
    if (video) {
      trimStart.value = video.trimStart
      trimEnd.value = video.trimEnd > 0 ? video.trimEnd : video.duration
    }
  }

  function setTrimRange(start: number, end: number) {
    trimStart.value = start
    trimEnd.value = end
    
    if (selectedVideoId.value) {
      const video = videos.value.find(v => v.id === selectedVideoId.value)
      if (video) {
        video.trimStart = start
        video.trimEnd = end
        saveToStorage()
      }
    }
  }

  function updateVideoDuration(id: string, duration: number) {
    const video = videos.value.find(v => v.id === id)
    if (video) {
      video.duration = duration
      if (video.trimEnd === 0 || video.trimEnd > duration) {
        video.trimEnd = duration
      }
      if (id === selectedVideoId.value) {
        trimEnd.value = video.trimEnd
      }
      saveToStorage()
    }
  }

  function togglePlaylistItem(id: string) {
    const video = videos.value.find(v => v.id === id)
    if (video) {
      video.isInPlaylist = !video.isInPlaylist
      saveToStorage()
    }
  }

  function setSort(field: SortField, direction?: SortDirection) {
    if (sortField.value === field && !direction) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortDirection.value = direction || 'asc'
    }
  }

  function clearPlaylist() {
    videos.value.forEach(v => v.isInPlaylist = false)
    saveToStorage()
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

  loadFromStorage()

  return {
    videos,
    selectedVideoId,
    selectedVideo,
    trimStart,
    trimEnd,
    trimDuration,
    playlist,
    sortedPlaylist,
    sortField,
    sortDirection,
    isProcessing,
    status,
    progress,
    addVideo,
    removeVideo,
    selectVideo,
    setTrimRange,
    updateVideoDuration,
    togglePlaylistItem,
    setSort,
    clearPlaylist,
    trimVideo,
    setStatus,
    saveToStorage
  }
})
