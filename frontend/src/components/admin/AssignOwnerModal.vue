<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useStaff } from '@/composables/useStaff'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'

  const props = defineProps<{
    isSubmitting?: boolean
    formError?: string
  }>()

  const emit = defineEmits<{
    (
      e: 'submit',
      data:
        | { type: 'staff'; staffUsername: string }
        | { type: 'client'; username: string; password: string; email?: string; roleLabel?: string }
    ): void
    (e: 'cancel'): void
  }>()

  const { adminT } = useAdminLanguage()
  const { staff, fetchStaff, isLoading: isLoadingStaff } = useStaff()

  // Tab state
  type OwnerType = 'staff' | 'client'
  const ownerType = ref<OwnerType>('staff')

  // Staff assignment form
  const selectedStaff = ref<string>('')

  // Client creation form
  const clientForm = ref({
    username: '',
    password: '',
    email: '',
    roleLabel: '',
    customRole: '',
  })
  const showPassword = ref(false)

  // Preset roles
  const presetRoles = ['Bride', 'Groom', 'Parent', 'Other']

  // Get role label display
  const getRoleDisplay = (role: string): string => {
    switch (role) {
      case 'Bride':
        return adminT.value.staff.bride
      case 'Groom':
        return adminT.value.staff.groom
      case 'Parent':
        return adminT.value.staff.parent
      case 'Other':
        return adminT.value.staff.other
      default:
        return role
    }
  }

  // Get final role label
  const finalRoleLabel = computed(() => {
    if (clientForm.value.roleLabel === 'Other') {
      return clientForm.value.customRole
    }
    return clientForm.value.roleLabel
  })

  // Validation
  const isValid = computed(() => {
    if (ownerType.value === 'staff') {
      return !!selectedStaff.value
    } else {
      return (
        clientForm.value.username.length >= 3 &&
        clientForm.value.password.length >= 8 &&
        (clientForm.value.roleLabel !== 'Other' || clientForm.value.customRole.length > 0)
      )
    }
  })

  // Handle submit
  const handleSubmit = () => {
    if (!isValid.value) return

    if (ownerType.value === 'staff') {
      emit('submit', { type: 'staff', staffUsername: selectedStaff.value })
    } else {
      emit('submit', {
        type: 'client',
        username: clientForm.value.username,
        password: clientForm.value.password,
        ...(clientForm.value.email && { email: clientForm.value.email }),
        ...(finalRoleLabel.value && { roleLabel: finalRoleLabel.value }),
      })
    }
  }

  onMounted(() => {
    // Fetch staff list if needed
    if (staff.value.length === 0) {
      fetchStaff()
    }
  })
</script>

<template>
  <div class="space-y-6">
    <!-- Tab Selection -->
    <div class="flex gap-2 border-b border-sand-dark dark:border-dark-border">
      <button
        type="button"
        class="px-4 py-2 font-body text-sm font-medium transition-colors cursor-pointer -mb-px"
        :class="
          ownerType === 'staff'
            ? 'text-sage border-b-2 border-sage'
            : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
        "
        @click="ownerType = 'staff'"
      >
        {{ adminT.staff.assignStaff }}
      </button>
      <button
        type="button"
        class="px-4 py-2 font-body text-sm font-medium transition-colors cursor-pointer -mb-px"
        :class="
          ownerType === 'client'
            ? 'text-sage border-b-2 border-sage'
            : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
        "
        @click="ownerType = 'client'"
      >
        {{ adminT.staff.createClient }}
      </button>
    </div>

    <!-- Staff Assignment Form -->
    <div v-if="ownerType === 'staff'" class="space-y-4">
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
          {{ adminT.staff.selectStaff }}
        </label>
        <div v-if="isLoadingStaff" class="flex items-center gap-2 py-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-sage"></div>
          <span class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            Loading staff...
          </span>
        </div>
        <select
          v-else
          v-model="selectedStaff"
          class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
        >
          <option value="">{{ adminT.staff.selectStaffPlaceholder }}</option>
          <option v-for="member in staff" :key="member.username" :value="member.username">
            {{ member.username }}
            <template v-if="member.email"> ({{ member.email }}) </template>
          </option>
        </select>
      </div>

      <div
        v-if="staff.length === 0 && !isLoadingStaff"
        class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
      >
        <p class="font-body text-sm text-amber-700 dark:text-amber-300">
          {{ adminT.staff.noStaffYet }}. {{ adminT.staff.createFirst }}
        </p>
      </div>
    </div>

    <!-- Client Creation Form -->
    <div v-else class="space-y-4">
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
        {{ adminT.staff.clientDetails }}
      </p>

      <!-- Username -->
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
          {{ adminT.staff.username }} *
        </label>
        <input
          v-model="clientForm.username"
          type="text"
          class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
          placeholder="e.g., ahmad"
        />
      </div>

      <!-- Email -->
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
          {{ adminT.staff.email }}
        </label>
        <input
          v-model="clientForm.email"
          type="email"
          class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
          placeholder="e.g., ahmad@email.com"
        />
      </div>

      <!-- Password -->
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
          {{ adminT.staff.password }} *
        </label>
        <div class="relative">
          <input
            v-model="clientForm.password"
            :type="showPassword ? 'text' : 'password'"
            class="w-full px-3 py-2 pr-10 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
            placeholder="Minimum 8 characters"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
            @click="showPassword = !showPassword"
          >
            <span v-if="showPassword">👁️</span>
            <span v-else>👁️‍🗨️</span>
          </button>
        </div>
      </div>

      <!-- Role Label -->
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
          {{ adminT.staff.roleLabel }}
        </label>
        <div class="flex flex-wrap gap-2 mb-2">
          <button
            v-for="role in presetRoles"
            :key="role"
            type="button"
            class="px-3 py-1.5 text-sm font-body rounded-full border transition-colors cursor-pointer"
            :class="
              clientForm.roleLabel === role
                ? 'bg-sage text-white border-sage'
                : 'border-sand-dark dark:border-dark-border text-charcoal-light dark:text-dark-text-secondary hover:border-sage hover:text-sage'
            "
            @click="clientForm.roleLabel = role"
          >
            {{ getRoleDisplay(role) }}
          </button>
        </div>
        <input
          v-if="clientForm.roleLabel === 'Other'"
          v-model="clientForm.customRole"
          type="text"
          class="w-full px-3 py-2 border border-sand-dark dark:border-dark-border rounded-lg font-body text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg focus:ring-2 focus:ring-sage focus:border-sage"
          :placeholder="adminT.staff.roleLabelPlaceholder"
        />
      </div>
    </div>

    <!-- Error -->
    <p v-if="formError" class="font-body text-sm text-red-500">
      {{ formError }}
    </p>

    <!-- Buttons -->
    <div class="flex justify-end gap-3 pt-4 border-t border-sand-dark dark:border-dark-border">
      <button
        type="button"
        class="px-4 py-2 font-body text-sm text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
        @click="$emit('cancel')"
      >
        {{ adminT.common.cancel }}
      </button>
      <button
        type="button"
        :disabled="!isValid || isSubmitting"
        class="px-4 py-2 bg-sage text-white font-body text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        @click="handleSubmit"
      >
        {{ isSubmitting ? adminT.common.saving : adminT.common.save }}
      </button>
    </div>
  </div>
</template>
