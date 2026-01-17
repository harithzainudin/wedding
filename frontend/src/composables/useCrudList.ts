import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface BaseItem {
  id: string
  order: number
}

export interface UseCrudListOptions<T extends BaseItem, TData> {
  sourceData: Ref<TData>
  getItems: (data: TData) => T[]
  cloneItem: (item: T) => T
  updateFn: (items: T[]) => Promise<{ success: boolean; error?: string }>
}

export interface UseCrudListReturn<T extends BaseItem> {
  localItems: Ref<T[]>
  showModal: Ref<boolean>
  editingItem: Ref<T | null>
  showDeleteModal: Ref<boolean>
  itemToDelete: Ref<T | null>
  hasChanges: ComputedRef<boolean>
  syncLocalItems: () => void
  openModal: (item?: T) => void
  closeModal: () => void
  confirmDelete: (item: T) => void
  deleteItem: () => void
  cancelDelete: () => void
  moveUp: (index: number) => void
  moveDown: (index: number) => void
  handleSave: () => Promise<void>
  discardChanges: () => void
}

export function useCrudList<T extends BaseItem, TData>(
  options: UseCrudListOptions<T, TData>
): UseCrudListReturn<T> {
  const { sourceData, getItems, cloneItem, updateFn } = options

  const localItems = ref<T[]>([]) as Ref<T[]>
  const showModal = ref(false)
  const editingItem = ref<T | null>(null) as Ref<T | null>
  const showDeleteModal = ref(false)
  const itemToDelete = ref<T | null>(null) as Ref<T | null>

  const hasChanges = computed(() => {
    return JSON.stringify(localItems.value) !== JSON.stringify(getItems(sourceData.value))
  })

  const syncLocalItems = () => {
    localItems.value = getItems(sourceData.value).map((item) => cloneItem(item))
  }

  const openModal = (item?: T) => {
    editingItem.value = item ?? null
    showModal.value = true
  }

  const closeModal = () => {
    showModal.value = false
    editingItem.value = null
  }

  const confirmDelete = (item: T) => {
    itemToDelete.value = item
    showDeleteModal.value = true
  }

  const deleteItem = () => {
    if (!itemToDelete.value) return
    localItems.value = localItems.value.filter((i) => i.id !== itemToDelete.value?.id)
    localItems.value.forEach((item, index) => {
      item.order = index
    })
    showDeleteModal.value = false
    itemToDelete.value = null
  }

  const cancelDelete = () => {
    showDeleteModal.value = false
    itemToDelete.value = null
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const item = localItems.value[index]
    localItems.value.splice(index, 1)
    localItems.value.splice(index - 1, 0, item as T)
    localItems.value.forEach((i, idx) => {
      i.order = idx
    })
  }

  const moveDown = (index: number) => {
    if (index === localItems.value.length - 1) return
    const item = localItems.value[index]
    localItems.value.splice(index, 1)
    localItems.value.splice(index + 1, 0, item as T)
    localItems.value.forEach((i, idx) => {
      i.order = idx
    })
  }

  const handleSave = async () => {
    await updateFn(localItems.value)
    syncLocalItems()
  }

  const discardChanges = () => {
    syncLocalItems()
  }

  return {
    localItems,
    showModal,
    editingItem,
    showDeleteModal,
    itemToDelete,
    hasChanges,
    syncLocalItems,
    openModal,
    closeModal,
    confirmDelete,
    deleteItem,
    cancelDelete,
    moveUp,
    moveDown,
    handleSave,
    discardChanges,
  }
}
