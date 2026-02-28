<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVideoStore } from '../stores/videoStore'

const videoStore = useVideoStore()
const trimMessage = ref('')

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00:00'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const canTrim = computed(() => {
  return videoStore.selectedVideo && 
         videoStore.trimEnd > videoStore.trimStart && 
         !videoStore.isProcessing &&
         videoStore.trimDuration >= 1
})

async function handleTrim() {
  if (!canTrim.value) return
  
  trimMessage.value = ''
  const result = await videoStore.trimVideo()
  
  if (result.success) {
    trimMessage.value = 'Video trimmed successfully!'
    setTimeout(() => { trimMessage.value = '' }, 3000)
  } else {
    trimMessage.value = `Error: ${result.error}`
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="videoStore.isPlaylistPlaying" class="flex items-center gap-2 bg-green-900/30 px-3 py-2 rounded">
      <span class="text-green-400 text-sm">▶ Playlist Mode</span>
      <button
        @click="videoStore.playPreviousInPlaylist()"
        :disabled="videoStore.playlistIndex <= 0"
        class="px-2 py-1 bg-gray-600 text-white rounded text-xs disabled:opacity-50"
      >
        ◀ Prev
      </button>
      <button
        @click="videoStore.stopPlaylist()"
        class="px-2 py-1 bg-red-600 text-white rounded text-xs"
      >
        ■ Stop
      </button>
      <button
        @click="videoStore.playNextInPlaylist()"
        :disabled="videoStore.playlistIndex >= videoStore.sortedPlaylist.length - 1"
        class="px-2 py-1 bg-gray-600 text-white rounded text-xs disabled:opacity-50"
      >
        Next ▶
      </button>
    </div>
    
    <div class="flex items-center justify-between">
      <div class="text-sm">
        <span class="text-gray-400">Trim Duration: </span>
        <span class="text-accent">{{ formatTime(videoStore.trimDuration) }}</span>
      </div>
      
      <button
        @click="handleTrim"
        :disabled="!canTrim"
        class="px-6 py-2 bg-accent text-white rounded font-medium transition-colors"
        :class="{
          'hover:bg-accent-hover cursor-pointer': canTrim,
          'bg-gray-600 cursor-not-allowed': !canTrim
        }"
      >
        {{ videoStore.isProcessing ? 'Processing...' : 'TRIM VIDEO' }}
      </button>
    </div>
    
    <div v-if="trimMessage" class="text-sm" :class="trimMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'">
      {{ trimMessage }}
    </div>
  </div>
</template>
