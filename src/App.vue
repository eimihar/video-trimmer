<script setup lang="ts">
import VideoList from './components/VideoList.vue'
import VideoPreview from './components/VideoPreview.vue'
import TrimControls from './components/TrimControls.vue'
import StatusBar from './components/StatusBar.vue'
</script>

<template>
  <div class="flex flex-col h-screen">
    <div class="flex flex-1 overflow-hidden">
      <div class="w-left-panel bg-panel-bg flex-shrink-0">
        <VideoList />
      </div>
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 p-4 overflow-auto">
          <VideoPreview />
        </div>
        <div class="border-t border-gray-700 p-4">
          <TrimControls />
        </div>
      </div>
    </div>
    <StatusBar />
  </div>
</template>