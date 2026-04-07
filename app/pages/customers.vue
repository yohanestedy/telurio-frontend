<script setup lang="ts">
import type { CustomerItem } from '../types/domain'

definePageMeta({
  title: 'Customers',
  roles: ['ADMIN'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const customers = ref<CustomerItem[]>([])
const search = ref('')
const dialogOpen = ref(false)
const editing = ref<CustomerItem | null>(null)
const submitting = ref(false)

async function loadCustomers() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<CustomerItem[]>('/customers', {
      ...pagination.query.value,
      search: search.value || undefined,
    })
    customers.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitCustomer(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/customers/${editing.value.id}`, payload)
      toast.success('Pelanggan berhasil diperbarui')
    } else {
      await api.post('/customers', payload)
      toast.success('Pelanggan berhasil dibuat')
    }
    dialogOpen.value = false
    editing.value = null
    await loadCustomers()
  } catch (caught) {
    toast.error('Gagal menyimpan pelanggan', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

onMounted(loadCustomers)
</script>

<template>
  <div class="space-y-6">
    <FilterBar>
      <UiInput v-model="search" label="Cari pelanggan" placeholder="Nama atau nomor telepon" />
      <template #actions>
        <UiButton variant="secondary" icon="search" @click="loadCustomers">Cari</UiButton>
        <UiButton icon="plus" @click="dialogOpen = true; editing = null">Tambah pelanggan</UiButton>
      </template>
    </FilterBar>

    <LoadingSkeleton v-if="loading" :lines="7" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadCustomers">Coba lagi</UiButton>
    </ErrorState>
    <TableCard v-else title="Daftar Pelanggan" description="Data customer yang dipakai saat membuat order." icon="customers">
      <table class="min-w-full text-left text-sm">
        <thead class="text-ink-500">
          <tr>
            <th class="pb-3 pr-4">Nama</th>
            <th class="pb-3 pr-4">Telepon</th>
            <th class="pb-3 pr-4">Alamat</th>
            <th class="pb-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in customers" :key="customer.id" class="border-t border-white/40">
            <td class="py-4 pr-4 font-medium text-ink-900">{{ customer.name }}</td>
            <td class="py-4 pr-4">{{ customer.phone || '-' }}</td>
            <td class="py-4 pr-4">{{ customer.address || '-' }}</td>
            <td class="py-4 text-right">
              <UiButton variant="ghost" size="sm" icon="edit" @click="dialogOpen = true; editing = customer">
                Edit
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </TableCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit pelanggan' : 'Tambah pelanggan'"
      description="Pelanggan baru akan langsung tersedia saat form order dibuka."
    >
      <FormsCustomerForm
        :initial-value="editing ? {
          name: editing.name,
          phone: editing.phone ?? '',
          address: editing.address ?? '',
        } : undefined"
        :submitting="submitting"
        @submit="submitCustomer"
      />
    </UiDialog>
  </div>
</template>
