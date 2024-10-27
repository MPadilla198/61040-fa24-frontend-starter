<script setup lang="ts">
import PostListComponent from "@/components/Post/PostListComponent.vue";
import SourceForm from "@/components/Source/SourceForm.vue";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
</script>

<template>
  <main>
    <h1>Home Page</h1>
    <section>
      <h1 v-if="isLoggedIn">Welcome {{ currentUsername }}!</h1>
      <h1 v-else>Please login!</h1>
    </section>
    <section id="dashboard" v-if="isLoggedIn">
      <h1>My Dashboard</h1>
      <section id="source">
        <h2>Source</h2>
        <SourceForm />
      </section>
      <section id="template">
        <h2>Template</h2>
        <!-- TODO: add component -->
      </section>
      <section id="label">
        <h2>Label</h2>
        <!-- TODO: add component -->
      </section>
      <section id="sort">
        <h2>Sort</h2>
        <!-- TODO: add component -->
      </section>
    </section>
    <PostListComponent />
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>
