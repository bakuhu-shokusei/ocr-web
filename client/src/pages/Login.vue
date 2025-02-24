<template>
  <div class="login">
    <Form
      :model="formState"
      name="basic"
      autocomplete="off"
      @finish="onFinish"
      class="login-form"
      layout="vertical"
    >
      <FormItem
        label="Username"
        name="userName"
        :rules="[{ required: true, message: 'Please input your username!' }]"
      >
        <Input v-model:value="formState.userName" />
      </FormItem>

      <FormItem
        label="Password"
        name="password"
        :rules="[{ required: true, message: 'Please input your password!' }]"
      >
        <InputPassword v-model:value="formState.password" />
      </FormItem>

      <FormItem>
        <Button type="primary" html-type="submit" class="login-form-button"
          >Login</Button
        >
      </FormItem>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Form, FormItem, Input, InputPassword, Button } from 'ant-design-vue'
import { login } from '../api'
import { useRouter } from 'vue-router'

const router = useRouter()

interface FormState {
  userName: string
  password: string
  remember: boolean
}

const formState = reactive<FormState>({
  userName: '',
  password: '',
  remember: true,
})

const onFinish = async (value: { userName: string; password: string }) => {
  const success = await login(value.userName, value.password)
  if (success) {
    router.push({ name: 'list' })
  }
}
</script>

<style lang="scss" scoped>
.login {
  max-width: 800px;
  margin: 16px auto;
  .login-form {
    padding: 0 16px;
    .login-form-button {
      width: 100%;
    }
  }
}
</style>
