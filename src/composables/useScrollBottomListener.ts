import { nextTick, onMounted, onUnmounted, type Ref } from "vue";
import type { OScroller } from "@opensig/opendesign";

const useScrollBottomListener = (oScrollerRef: Ref<InstanceType<typeof OScroller> | undefined>, callback: () => void) => {
  const onScroll = (event: Event) => {
    const el = event.target as HTMLDivElement;
    if (el.scrollHeight - Math.round(el.scrollTop) <= el.clientHeight) {
      callback();
    }
  };

  onMounted(() => {
    nextTick(() => {
      oScrollerRef.value?.getContainerEl()?.addEventListener('scroll', onScroll);
    })
  });
  
  onUnmounted(() => {
    oScrollerRef.value?.getContainerEl()?.removeEventListener('scroll', onScroll);
  });

  const scrollTop = () => {
    const container = oScrollerRef.value?.getContainerEl() as HTMLDivElement;
    container.scrollTop = 0;
  }

  return {
    scrollTop
  };
};

export default useScrollBottomListener;