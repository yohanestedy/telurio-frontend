<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

const schema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter'),
  isActive: z.boolean().optional(),
})

type FormValues = {
  name: string
  isActive: boolean
}

const props = defineProps<{
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [{ name: string; isActive?: boolean }]
}>()

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    name: '',
    isActive: true,
  },
})

const [name] = defineField('name')
const [isActive] = defineField('isActive')

watch(
  () => props.initialValue,
  (value) => {
    resetForm({
      values: {
        name: value?.name ?? '',
        isActive: value?.isActive ?? true,
      },
    })
  },
  { immediate: true, deep: true },
)

const onSubmit = handleSubmit((values) => {
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', parsed.data)
})
</script>

<template>
  <form class="grid gap-4" @submit.prevent="onSubmit">
    <UiInput v-model="name" label="Nama kategori" :error="errors.name" />
    <UiCheckbox v-if="isEdit" v-model="isActive" label="Kategori aktif" />
    <div class="flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan kategori' }}
      </UiButton>
    </div>
  </form>
</template>
