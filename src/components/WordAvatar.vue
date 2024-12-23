<script setup lang="ts">
import { isNumber } from '@opensig/opendesign';
import { computed, type PropType } from 'vue';

const props = defineProps({
  name: {
    type: [String, Number],
    default: '',
    required: true,
  },
  // mini： 16 small： 24， medium： 40， large： 64
  size: {
    type: String as PropType<'mini' | 'small' | 'medium' | 'large'>,
    default: 'medium',
  },
  // 大小尺寸自定义，单位px
  customSize: {
    type: Number,
    default: 0,
  },
  variant: {
    type: String as PropType<'round' | 'square'>,
    default: 'round',
  },
});

const bgColorArr = ['#058EF0', '#FA7305', '#03B5A5'];

const avatarText = computed(() => (typeof props.name === 'string' ? props.name?.charAt(0).toUpperCase() : props.name));
const getAvatarStyle = computed(() => {
  const avatarStyle = {
    'background-color': '',
    width: '40px',
    height: '40px',
    'font-size': '20px',
  };
  avatarStyle['background-color'] = props.name ? bgColorArr[(isNumber(props.name) ? props.name : props.name?.length) % bgColorArr.length] : 'transparent';
  let sizeNum = 0;
  if (props.customSize) {
    sizeNum = Number(props.customSize);
  } else {
    const sizeToNum = {
      mini: 16,
      small: 24,
      medium: 40,
      large: 64,
    };
    sizeNum = sizeToNum[props.size];
  }
  avatarStyle.height = `${sizeNum}px`;
  avatarStyle.width = `${sizeNum}px`;
  avatarStyle['font-size'] = `${sizeNum / 2}px`;
  return avatarStyle;
});
</script>

<template>
  <div class="word-avatar" :class="variant" :style="getAvatarStyle">
    <slot v-if="$slots.icon" name="icon"></slot>
    <template v-else>
      {{ avatarText }}
    </template>
  </div>
</template>

<style lang="scss" scoped>
.word-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--o-color-info1-inverse);
}
.round {
  border-radius: 50%;
}
</style>
