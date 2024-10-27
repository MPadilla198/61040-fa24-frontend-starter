<script setup lang="ts">
import { ref } from "vue";

import { NotImplementedError } from "@/utils/errors";
import { fetchy } from "@/utils/fetchy";
import { SourceTarget } from "@/utils/types";

const source = ref("");
const sourceType = ref("url");
const emit = defineEmits(["refreshSources"]);

const createURLsource = async (content: string) => {
  try {
    await fetchy("/api/source/url", "POST", {
      body: { content },
    });
  } catch {
    return; // TODO
  }
  emit("refreshSources");
  emptyForm();
};

const createFileSource = async (content: string) => {
  throw new NotImplementedError();
};

const createFolderSource = async (content: string) => {
  throw new NotImplementedError();
};

const emptyForm = () => {
  source.value = "";
};

const typeIsURL = async () => {
  return sourceType.value === SourceTarget.URL;
};

const typeIsFile = async () => {
  return sourceType.value === SourceTarget.File;
};

const typeIsFolder = async () => {
  return sourceType.value === SourceTarget.Folder;
};

const createSource = async (content: string) => {
  switch (sourceType.value) {
    case SourceTarget.URL:
      await createURLsource(content);
      break;
    case SourceTarget.File:
      await createFileSource(content);
      break;
    case SourceTarget.Folder:
      await createFolderSource(content);
      break;
    default:
      throw new NotImplementedError();
  }
};
</script>

<template>
  <select id="target" v-model="sourceType">
    <option value="url">URL</option>
    <option value="file">File</option>
    <option value="folder">Folder</option>
  </select>
  <form @submit.prevent="createSource(source)">
    <label for="path_uri">
      Source
      <span v-show="sourceType.valueOf() === SourceTarget.URL">URL</span>
      <span v-show="sourceType.valueOf() === SourceTarget.File">File URI</span>
      <span v-show="sourceType.valueOf() === SourceTarget.Folder">Folder URI</span>
    </label>
    <input id="path_uri" v-model="source" placeholder="Create a new source!" required />
    <button type="submit" class="pure-button-primary pure-button">Create Source</button>
  </form>
</template>

<style scoped></style>
