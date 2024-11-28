<script setup lang="ts">
import CreateSourceForm from "@/components/Source/CreateSourceForm.vue";
import { useSourceStore } from "@/stores/source";
import { storeToRefs } from "pinia";

const { userSources, isEmpty } = storeToRefs(useSourceStore());

async function getSources() {}
</script>

<template>
  <section>
    <h3>Create a source:</h3>
    <CreateSourceForm @refreshSources="getSources" />
  </section>
  <section v-if="!isEmpty">
    <h3>List of Sources</h3>
    <article v-for="[, s] in userSources" :key="s"></article>
  </section>
</template>

<style scoped></style>
