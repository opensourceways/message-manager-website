<script setup lang="ts">
import { OBreadcrumb, OBreadcrumbItem } from '@opensig/opendesign';

const breadcrumbs = [
  { text: '消息中心', name: 'home' },
  { text: '消息订阅设置', name: 'settings' },
];
</script>

<template>
  <OBreadcrumb>
    <OBreadcrumbItem v-for="(item, index) in breadcrumbs" :key="index" :to="{ name: item.name }">
      {{ item.text }}
    </OBreadcrumbItem>
  </OBreadcrumb>
</template>