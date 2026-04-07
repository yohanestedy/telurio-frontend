<script setup lang="ts">
import type { CoopItem } from '../types/domain'

definePageMeta({
  title: 'Coops',
  roles: ['ADMIN'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const coops = ref<CoopItem[]>([])
const dialogOpen = ref(false)
const editing = ref<CoopItem | null>(null)
const submitting = ref(false)

async function loadCoops() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<CoopItem[]>('/coops', pagination.query.value)
    coops.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitCoop(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/coops/${editing.value.id}`, payload)
      toast.success('Kandang berhasil diperbarui')
    } else {
      await api.post('/coops', payload)
      toast.success('Kandang berhasil dibuat')
    }
    dialogOpen.value = false
    editing.value = null
    await loadCoops()
  } catch (caught) {
    toast.error('Gagal menyimpan kandang', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

onMounted(loadCoops)
</script>

<template>
  <div class="space-y-6">
    <FilterBar>
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadCoops">Refresh</UiButton>
        <UiButton icon="plus" @click="dialogOpen = true; editing = null">Tambah kandang</UiButton>
      </template>
    </FilterBar>

    <LoadingSkeleton v-if="loading" :lines="7" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadCoops">Coba lagi</UiButton>
    </ErrorState>
    <TableCard v-else title="Daftar Kandang" description="Master kandang dan parameter penyusutan aktif." icon="coops">
      <table class="min-w-full text-left text-sm">
        <thead class="text-ink-500">
          <tr>
            <th class="pb-3 pr-4">Nama</th>
            <th class="pb-3 pr-4">Populasi</th>
            <th class="pb-3 pr-4">Penyusutan</th>
            <th class="pb-3 pr-4">Status</th>
            <th class="pb-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="coop in coops" :key="coop.id" class="border-t border-white/40">
            <td class="py-4 pr-4">
              <p class="font-medium text-ink-900">{{ coop.name }}</p>
              <p class="text-xs text-ink-500">{{ coop.chickenStrain || '-' }}</p>
            </td>
            <td class="py-4 pr-4">{{ coop.population }}</td>
            <td class="py-4 pr-4">{{ coop.depreciationPercent }}%</td>
            <td class="py-4 pr-4">
              <UiBadge :tone="coop.isActive ? 'success' : 'danger'">
                {{ coop.isActive ? 'Aktif' : 'Nonaktif' }}
              </UiBadge>
            </td>
            <td class="py-4 text-right">
              <UiButton
                variant="ghost"
                size="sm"
                icon="edit"
                @click="dialogOpen = true; editing = coop"
              >
                Edit
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </TableCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit kandang' : 'Tambah kandang'"
      description="Pastikan field kandang sesuai master data backend."
    >
      <FormsCoopForm
        :initial-value="editing ? {
          name: editing.name,
          population: String(editing.population),
          chickenStrain: editing.chickenStrain ?? '',
          chickBirthDate: editing.chickBirthDate ? isoDate(editing.chickBirthDate) : '',
          depreciationPercent: editing.depreciationPercent,
          isActive: editing.isActive,
        } : undefined"
        :submitting="submitting"
        @submit="submitCoop"
      />
    </UiDialog>
  </div>
</template>
