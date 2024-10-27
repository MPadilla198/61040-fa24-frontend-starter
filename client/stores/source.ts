import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { fetchy } from "../utils/fetchy";
import { SourceTarget } from "../utils/types";

export const useSourceStore = defineStore("source", () => {
  const userSources = ref<Map<string, any>>(new Map<string, any>());

  const isEmpty = computed(() => userSources.value.size === 0);

  const resetStore = () => {
    userSources.value.clear();
  };

  const getSources = async () => {
    try {
      const sources = await fetchy("api/source", "GET", {});
      userSources.value = sources;
    } catch {
      userSources.value.clear();
    }
  };

  const getSource = async (sourceID: string) => {
    try {
      const result = await fetchy("/api/source/" + sourceID, "GET", {});
      userSources.value.set(sourceID, result);
    } catch {
      userSources.value.delete(sourceID);
    }
  };

  const createSource = async (type: SourceTarget, path_uri: string) => {
    try {
      const newSourceID = await fetchy("/api/source/" + type, "POST", {
        body: { path_uri },
      });
      const result = await fetchy("/api/source/" + newSourceID, "GET", {});
      userSources.value.set(newSourceID, result);
    } catch {
      return;
    }
  };

  const deleteSource = async (sourceID: string) => {
    try {
      await fetchy("/api/source/" + sourceID, "DELETE", {});
      userSources.value.delete(sourceID);
    } catch {
      return;
    }
  };

  return {
    userSources,
    isEmpty,
    resetStore,
    getSources,
    getSource,
    createSource,
    deleteSource,
  };
});
