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
  <ProfilePasswordSetting
    class="max-w-xl"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
