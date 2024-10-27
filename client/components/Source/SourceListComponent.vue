<script setup lang="ts">
import CreateSourceForm from "@/components/Source/CreateSourceForm.vue";

async function getSources() {}
</script>

<template>
  <section>
    <h3>Create a source:</h3>
    <CreateSourceForm @refreshSources="getSources" />
  </section>
</template>

<style scoped></style>
