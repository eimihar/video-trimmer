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

export type SortField = 'name' | 'duration' | 'date' | 'custom'
export type SortDirection = 'asc' | 'desc'

const STORAGE_KEY = 'trimmer_videos'
const ORDER_STORAGE_KEY = 'trimmer_playlist_order'

export const useVideoStore = defineStore('video', () => {
  const videos = ref<VideoItem[]>([])
  const selectedVideoId = ref<string | null>(null)
  const trimStart = ref<number>(0)
  const trimEnd = ref<number>(0)
  const isProcessing = ref<boolean>(false)
  const status = ref<string>('Ready')
  const progress = ref<number>(0)
  const sortField = ref<SortField>('custom')
  const sortDirection = ref<SortDirection>('asc')
  const playlistOrder = ref<string[]>([])
  const isPlaylistPlaying = ref<boolean>(false)
  const playlistIndex = ref<number>(0)

  const selectedVideo = computed(() => {
    return videos.value.find(v => v.id === selectedVideoId.value) || null
  })

  const playlist = computed(() => {
    return videos.value.filter(v => v.isInPlaylist)
  })

  const sortedPlaylist = computed(() => {
    const playlistVideos = [...playlist.value]
    
    if (sortField.value === 'custom') {
      return playlistVideos.sort((a, b) => {
        const indexA = playlistOrder.value.indexOf(a.id)
        const indexB = playlistOrder.value.indexOf(b.id)
        const orderA = indexA === -1 ? Infinity : indexA
        const orderB = indexB === -1 ? Infinity : indexB
        return orderA - orderB
      })
    }
    
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
      
      const orderStored = localStorage.getItem(ORDER_STORAGE_KEY)
      if (orderStored) {
        playlistOrder.value = JSON.parse(orderStored)
      }
      
      if (playlistOrder.value.length === 0 && videos.value.length > 0) {
        playlistOrder.value = videos.value.map(v => v.id)
        saveToStorage()
      }
    } catch (error) {
      console.error('Failed to load videos from storage:', error)
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videos.value))
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(playlistOrder.value))
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
    playlistOrder.value.push(video.id)
    if (!selectedVideoId.value) {
      selectVideo(video.id)
    }
    saveToStorage()
  }

  function removeVideo(id: string) {
    const index = videos.value.findIndex(v => v.id === id)
    if (index !== -1) {
      videos.value.splice(index, 1)
      const orderIndex = playlistOrder.value.indexOf(id)
      if (orderIndex !== -1) {
        playlistOrder.value.splice(orderIndex, 1)
      }
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
    playlistOrder.value = []
    saveToStorage()
  }

  function reorderPlaylist(fromIndex: number, toIndex: number) {
    const newOrder = [...playlistOrder.value]
    const item = newOrder.splice(fromIndex, 1)[0]
    newOrder.splice(toIndex, 0, item)
    playlistOrder.value = newOrder
    sortField.value = 'custom'
    saveToStorage()
  }

  function playPlaylist() {
    if (sortedPlaylist.value.length === 0) return
    isPlaylistPlaying.value = true
    const currentIndex = sortedPlaylist.value.findIndex(v => v.id === selectedVideoId.value)
    playlistIndex.value = currentIndex >= 0 ? currentIndex : 0
    selectVideo(sortedPlaylist.value[playlistIndex.value].id)
  }

  function playNextInPlaylist() {
    if (!isPlaylistPlaying.value) return
    if (playlistIndex.value < sortedPlaylist.value.length - 1) {
      playlistIndex.value++
      selectVideo(sortedPlaylist.value[playlistIndex.value].id)
    } else {
      isPlaylistPlaying.value = false
    }
  }

  function playPreviousInPlaylist() {
    if (!isPlaylistPlaying.value) return
    if (playlistIndex.value > 0) {
      playlistIndex.value--
      selectVideo(sortedPlaylist.value[playlistIndex.value].id)
    }
  }

  function stopPlaylist() {
    isPlaylistPlaying.value = false
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
    playlistOrder,
    isPlaylistPlaying,
    playlistIndex,
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
    reorderPlaylist,
    playPlaylist,
    playNextInPlaylist,
    playPreviousInPlaylist,
    stopPlaylist,
    trimVideo,
    setStatus,
    saveToStorage
  }
})
