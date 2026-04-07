<script setup lang="ts">
import type { CoopItem, ProductionItem } from '../types/domain'

definePageMeta({
  title: 'Productions',
  roles: ['ADMIN', 'OPERATOR'],
})

const api = useApi()
const toast = useToast()
const { can } = useAuth()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const productions = ref<ProductionItem[]>([])
const coops = ref<CoopItem[]>([])
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editing = ref<ProductionItem | null>(null)
const deleting = ref<ProductionItem | null>(null)
const submitting = ref(false)
const coopFilter = ref('')

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)

async function loadSupporting() {
  const response = await api.getPage<CoopItem[]>('/coops', { page: 1, limit: 100 })
  coops.value = response.data
}

async function loadProductions() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<ProductionItem[]>('/productions', {
      ...pagination.query.value,
      coopId: coopFilter.value || undefined,
    })
    productions.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitProduction(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/productions/${editing.value.id}`, payload)
      toast.success('Produksi berhasil diperbarui')
    } else {
      await api.post('/productions', payload)
      toast.success('Produksi berhasil ditambahkan')
    }
    dialogOpen.value = false
    editing.value = null
    await loadProductions()
  } catch (caught) {
    toast.error('Gagal menyimpan produksi', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function deleteProduction(payload: { deleteReason: string }) {
  if (!deleting.value) {
    return
  }

  submitting.value = true
  try {
    await api.delete(`/productions/${deleting.value.id}`, payload)
    toast.success('Produksi berhasil dihapus')
    deleteDialogOpen.value = false
    deleting.value = null
    await loadProductions()
  } catch (caught) {
    toast.error('Gagal menghapus produksi', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadProductions()])
})
</script>

<template>
  <div class="space-y-6">
    <FilterBar>
      <UiSelect
        v-model="coopFilter"
        :options="coopOptions"
        label="Filter kandang"
        placeholder="Semua kandang"
      />
      <template #actions>
        <UiButton variant="secondary" @click="loadProductions">Refresh</UiButton>
        <UiButton v-if="can('productions.manage')" @click="dialogOpen = true; editing = null">Tambah produksi</UiButton>
      </template>
    </FilterBar>

    <LoadingSkeleton v-if="loading" :lines="8" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton @click="loadProductions">Coba lagi</UiButton>
    </ErrorState>
    <TableCard v-else title="Produksi Harian" description="Mendukung lebih dari satu pengambilan per hari per kandang.">
      <table class="min-w-full text-left text-sm">
        <thead class="text-ink-500">
          <tr>
            <th class="pb-3 pr-4">Tanggal</th>
            <th class="pb-3 pr-4">Kandang</th>
            <th class="pb-3 pr-4">Waktu</th>
            <th class="pb-3 pr-4">Good Kg</th>
            <th class="pb-3 pr-4">Jumlah</th>
            <th class="pb-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in productions" :key="item.id" class="border-t border-white/40">
            <td class="py-4 pr-4">{{ formatDate(item.date) }}</td>
            <td class="py-4 pr-4">{{ item.coopName }}</td>
            <td class="py-4 pr-4">{{ item.collectionTime }}</td>
            <td class="py-4 pr-4">{{ item.goodKg }}</td>
            <td class="py-4 pr-4">{{ item.goodCount }}</td>
            <td class="py-4 text-right">
              <UiButton
                v-if="can('productions.manage') && useAuthStore().role === 'ADMIN'"
                variant="ghost"
                size="sm"
                @click="dialogOpen = true; editing = item"
              >
                Edit
              </UiButton>
              <UiButton
                v-if="can('productions.manage') && useAuthStore().role === 'ADMIN'"
                variant="ghost"
                size="sm"
                @click="deleteDialogOpen = true; deleting = item"
              >
                Hapus
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </TableCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit produksi' : 'Tambah produksi'"
      description="Gunakan collection time aktual agar multi-input per hari tetap valid."
    >
      <FormsProductionForm
        :coop-options="coopOptions"
        :submitting="submitting"
        :is-edit="Boolean(editing)"
        :initial-value="editing ? {
          date: isoDate(editing.date),
          coopId: editing.coopId,
          collectionTime: editing.collectionTime,
          goodKg: editing.goodKg,
          goodCount: String(editing.goodCount),
          brokenCount: String(editing.brokenCount ?? ''),
          notes: editing.notes ?? '',
        } : undefined"
        @submit="submitProduction"
      />
    </UiDialog>

    <UiDialog
      v-model:open="deleteDialogOpen"
      title="Hapus produksi"
      description="Penghapusan memerlukan alasan agar tetap audit-friendly."
    >
      <FormsDeleteReasonForm :submitting="submitting" @submit="deleteProduction" />
    </UiDialog>
  </div>
</template>
