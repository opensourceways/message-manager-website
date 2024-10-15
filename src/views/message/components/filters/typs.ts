import type { PropType } from 'vue';

export const filterProps = {
  /** 此时已点击的快捷筛选的具体内容，用来回填到各个筛选项 */
  quickFilterDetail: {
    type: Object as PropType<Record<string, any> | null>,
  },
  popupContainer: {
    type: Object as PropType<HTMLElement>,
  },
};

export interface FilterEmits {
  (event: 'applyFilter', val: Record<string, any>): void;
}
