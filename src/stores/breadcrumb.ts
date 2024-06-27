import { defineStore } from "pinia";
import { ref } from "vue";

type Breadcrumb = {
  text: string;
  name: string;
};

const useBreadcrumbStore = defineStore('breadcrumb', () => {
  const breadcrumbs = ref<Breadcrumb[]>([]);

  function push(...args: Breadcrumb[]) {
    breadcrumbs.value.push(...args);
  }

  function clear() {
    breadcrumbs.value = [];
  }
  return {
    breadcrumbs,
    push,
    clear
  };
});

export default useBreadcrumbStore;