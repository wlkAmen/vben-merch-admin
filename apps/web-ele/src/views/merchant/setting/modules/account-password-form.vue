<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { changePasswordApi } from '#/api';
import { useAuthStore } from '#/store';

const authStore = useAuthStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: '原密码',
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请输入原密码',
      },
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
      rules: z
        .string({ required_error: '请输入新密码' })
        .min(6, { message: '新密码至少 6 位' }),
    },
    {
      fieldName: 'confirmPassword',
      label: '确认新密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === newPassword, {
              message: '两次输入的新密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  try {
    await changePasswordApi({
      confirm_password: values.confirmPassword,
      new_password: values.newPassword,
      old_password: values.oldPassword,
    });

    ElMessage.success('密码修改成功，请重新登录');
    await authStore.logout();
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="grid gap-5">
    <section class="rounded-2xl border bg-muted/15 p-4">
      <div class="text-base font-semibold text-foreground">安全设置</div>
      <div class="mt-1 text-sm text-muted-foreground">
        修改密码后将立即退出当前登录，用新密码重新进入后台。
      </div>
    </section>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div class="rounded-2xl border p-4">
        <div class="mb-4 text-sm font-medium text-foreground">修改登录密码</div>
        <ProfilePasswordSetting
          class="max-w-none"
          :form-schema="formSchema"
          @submit="handleSubmit"
        />
      </div>

      <div class="rounded-2xl border bg-muted/10 p-4">
        <div class="text-sm font-medium text-foreground">操作提醒</div>
        <div class="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>建议定期更换管理员密码，避免多人长期共用同一账号。</p>
          <p>密码修改成功后，当前账号会立即退出，避免旧会话继续使用。</p>
          <p>新密码建议同时包含字母和数字，减少弱口令风险。</p>
        </div>
      </div>
    </div>
  </div>
</template>
