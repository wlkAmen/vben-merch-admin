<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({ name: 'MerchantFeaturePlaceholder' });

const route = useRoute();

const title = computed(() => String(route.meta.title || '功能建设中'));
const description = computed(
  () =>
    String(route.meta.description || '页面骨架已经就位，下一步接入真实业务接口。'),
);
</script>

<template>
  <div class="merchant-placeholder">
    <div class="merchant-placeholder__panel">
      <p class="merchant-placeholder__eyebrow">Static Route Ready</p>
      <h1>{{ title }}</h1>
      <p class="merchant-placeholder__desc">
        {{ description }}
      </p>

      <div class="merchant-placeholder__meta">
        <span>当前路由：{{ route.path }}</span>
        <span>阶段：页面骨架已接入</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.merchant-placeholder {
  min-height: calc(100vh - 140px);
  padding: 24px;
}

.merchant-placeholder__panel {
  border: 1px solid rgb(15 23 42 / 10%);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgb(253 224 71 / 25%), transparent 26%),
    linear-gradient(135deg, rgb(255 255 255), rgb(248 250 252));
  box-shadow: 0 20px 45px rgb(15 23 42 / 8%);
  padding: 32px;
}

.merchant-placeholder__eyebrow {
  color: #b45309;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0 0 12px;
  text-transform: uppercase;
}

.merchant-placeholder__panel h1 {
  color: #0f172a;
  font-size: 32px;
  line-height: 1.2;
  margin: 0 0 16px;
}

.merchant-placeholder__desc {
  color: #475569;
  font-size: 15px;
  line-height: 1.8;
  margin: 0;
  max-width: 760px;
}

.merchant-placeholder__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.merchant-placeholder__meta span {
  background: rgb(255 255 255 / 85%);
  border: 1px solid rgb(251 191 36 / 30%);
  border-radius: 999px;
  color: #92400e;
  font-size: 13px;
  padding: 8px 14px;
}

@media (max-width: 768px) {
  .merchant-placeholder {
    padding: 16px;
  }

  .merchant-placeholder__panel {
    padding: 24px;
  }

  .merchant-placeholder__panel h1 {
    font-size: 26px;
  }
}
</style>
