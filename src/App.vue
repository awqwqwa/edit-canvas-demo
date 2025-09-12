<script setup lang="ts">
import PosterEditor from './components/PosterEditor.vue'
</script>

<template>
  <div class="app">
    <PosterEditor />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#app {
  height: 100vh;
}

.app {
  height: 100%;
}
</style>
