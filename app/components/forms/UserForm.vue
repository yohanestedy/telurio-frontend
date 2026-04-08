<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { roles } from '../../types/domain'
import { mapZodErrors } from '../../utils/form'

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter').optional(),
  password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional(),
})

type FormValues = {
  name: string
  username: string
  password: string
  role: string
  isActive: boolean
}

const props = defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  initialValue?: Partial<FormValues> & {
    coopAccesses?: Array<{
      coopId: string
      ownershipSharePercent?: string | null
    }>
  }
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [
    {
      name?: string
      username?: string
      password?: string
      role?: 'OWNER' | 'OPERATOR'
      isActive?: boolean
      coopAccesses?: Array<{
        coopId: string
        ownershipSharePercent?: number
      }>
    },
  ]
}>()

const selectedCoopIds = ref<string[]>([])
const shareByCoop = ref<Record<string, string>>({})

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    name: '',
    username: '',
    password: '',
    role: 'OWNER',
    isActive: true,
  },
})

const [name] = defineField('name')
const [username] = defineField('username')
const [password] = defineField('password')
const [role] = defineField('role')
const [isActive] = defineField('isActive')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        name: value?.name ?? '',
        username: value?.username ?? '',
        password: '',
        role: value?.role ?? 'OWNER',
        isActive: value?.isActive ?? true,
      },
    })
    selectedCoopIds.value = value?.coopAccesses?.map((item) => item.coopId) ?? []
    shareByCoop.value = Object.fromEntries(
      (value?.coopAccesses ?? []).map((item) => [item.coopId, item.ownershipSharePercent ?? '']),
    )
  },
  { immediate: true },
)

function toggleCoop(coopId: string, checked: boolean) {
  selectedCoopIds.value = checked
    ? [...selectedCoopIds.value, coopId]
    : selectedCoopIds.value.filter((item) => item !== coopId)
}

const onSubmit = handleSubmit((values) => {
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  const coopAccesses = selectedCoopIds.value.map((coopId) => ({
    coopId,
    ownershipSharePercent:
      parsed.data.role === 'OWNER' && shareByCoop.value[coopId]
        ? Number(shareByCoop.value[coopId])
        : undefined,
  }))

  emit('submit', props.isEdit
    ? {
        name: parsed.data.name,
        isActive: parsed.data.isActive,
        coopAccesses,
      }
    : {
        name: parsed.data.name,
        username: parsed.data.username,
        password: parsed.data.password,
        role: parsed.data.role as 'OWNER' | 'OPERATOR',
        coopAccesses,
      })
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="grid gap-4 md:grid-cols-2">
      <UiInput v-model="name" label="Nama" :error="errors.name" />
      <UiSelect
        v-if="!isEdit"
        v-model="role"
        :options="[
          { label: 'Owner', value: 'OWNER' },
          { label: 'Operator', value: 'OPERATOR' },
        ]"
        label="Role"
        :error="errors.role"
      />
      <UiInput v-if="!isEdit" v-model="username" label="Username" :error="errors.username" />
      <UiInput v-if="!isEdit" v-model="password" label="Password" type="password" :error="errors.password" />
    </div>

    <div class="rounded-[24px] border border-white/40 bg-white/55 p-4">
      <p class="text-sm font-semibold text-ink-900">Akses kandang</p>
      <div class="mt-4 grid gap-3">
        <label
          v-for="coop in coopOptions"
          :key="coop.value"
          class="rounded-2xl border border-white/40 bg-white/70 p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <input
                :checked="selectedCoopIds.includes(coop.value)"
                type="checkbox"
                class="h-4 w-4 rounded"
                @change="toggleCoop(coop.value, ($event.target as HTMLInputElement).checked)"
              >
              <span class="text-sm font-medium text-ink-800">{{ coop.label }}</span>
            </div>
            <UiInput
              v-if="role === 'OWNER' && selectedCoopIds.includes(coop.value)"
              v-model="shareByCoop[coop.value]"
              label=""
              type="number"
              placeholder="Share %"
            />
          </div>
        </label>
      </div>
    </div>

    <UiCheckbox v-if="isEdit" v-model="isActive" label="User aktif" />

    <div class="flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan user' }}
      </UiButton>
    </div>
  </form>
</template>
