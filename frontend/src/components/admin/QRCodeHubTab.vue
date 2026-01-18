<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import type {
    QRCodeHubSettings,
    QRCodeHubUpdateRequest,
    QRCodeType,
    LocationApp,
    WifiEncryption,
  } from '@/types/qrCodeHub'
  import {
    DEFAULT_QRCODE_HUB_SETTINGS,
    DEFAULT_RESTU_TAGLINE,
    VALID_LOCATION_APPS,
    VALID_WIFI_ENCRYPTIONS,
  } from '@/types/qrCodeHub'
  import { useQRCodeHub } from '@/composables/useQRCodeHub'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { getStoredPrimaryWeddingId } from '@/services/tokenManager'

  const { adminT } = useAdminLanguage()
  const { withLoading } = useLoadingOverlay()

  // Wedding context
  const weddingId = computed(() => getStoredPrimaryWeddingId())

  const {
    settings,
    isLoading,
    isSaving,
    isUploading,
    loadError,
    saveError,
    uploadError,
    uploadProgress,
    fetchSettingsAdmin,
    saveSettings,
    uploadRestuDigitalImage,
  } = useQRCodeHub()

  // Local form state (copy of settings for editing)
  const formData = ref<QRCodeHubSettings>({ ...DEFAULT_QRCODE_HUB_SETTINGS })
  const saveSuccess = ref(false)
  const expandedSection = ref<string | null>(null)

  // File input ref
  const fileInputRef = ref<HTMLInputElement | null>(null)

  // QR Code type labels (computed for translations)
  const qrTypeLabels = computed(
    (): Record<QRCodeType, { title: string; subtitle: string; icon: string }> => ({
      website: {
        title: adminT.value.qrHub.websiteTitle,
        subtitle: adminT.value.qrHub.websiteSubtitle,
        icon: '🌐',
      },
      restuDigital: {
        title: adminT.value.qrHub.restuDigitalTitle,
        subtitle: adminT.value.qrHub.restuDigitalSubtitle,
        icon: '💝',
      },
      location: {
        title: adminT.value.qrHub.locationTitle,
        subtitle: adminT.value.qrHub.locationSubtitle,
        icon: '📍',
      },
      wifi: {
        title: adminT.value.qrHub.wifiTitle,
        subtitle: adminT.value.qrHub.wifiSubtitle,
        icon: '📶',
      },
      rsvp: {
        title: adminT.value.qrHub.rsvpTitle,
        subtitle: adminT.value.qrHub.rsvpSubtitle,
        icon: '✉️',
      },
      calendar: {
        title: adminT.value.qrHub.calendarTitle,
        subtitle: adminT.value.qrHub.calendarSubtitle,
        icon: '📅',
      },
      hashtag: {
        title: adminT.value.qrHub.hashtagTitle,
        subtitle: adminT.value.qrHub.hashtagSubtitle,
        icon: '📸',
      },
    })
  )

  // Location app labels (computed for translations)
  const locationAppLabels = computed(
    (): Record<LocationApp, string> => ({
      google_maps: adminT.value.qrHub.googleMapsOnly,
      waze: adminT.value.qrHub.wazeOnly,
      both: adminT.value.qrHub.googleMapsAndWaze,
    })
  )

  // WiFi encryption labels (computed for translations)
  const wifiEncryptionLabels = computed(
    (): Record<WifiEncryption, string> => ({
      WPA: adminT.value.qrHub.wpaRecommended,
      WEP: adminT.value.qrHub.wep,
      nopass: adminT.value.qrHub.noPassword,
    })
  )

  // Check if there are unsaved changes
  const hasChanges = computed(() => {
    return JSON.stringify(formData.value) !== JSON.stringify(settings.value)
  })

  // Validation warnings for Digital Blessing
  const restuDigitalWarning = computed(() => {
    if (!formData.value.restuDigital.enabled) return null

    if (formData.value.restuDigital.useImage) {
      if (!formData.value.restuDigital.qrImageUrl) {
        return adminT.value.qrHub.uploadOrDisable
      }
    } else {
      const hasAllBankDetails =
        formData.value.restuDigital.bankName &&
        formData.value.restuDigital.bankAccountName &&
        formData.value.restuDigital.bankAccountNumber
      if (!hasAllBankDetails) {
        return adminT.value.qrHub.fillBankDetails
      }
    }
    return null
  })

  // Validation warning for WiFi
  const wifiWarning = computed(() => {
    if (!formData.value.wifi.enabled) return null
    if (!formData.value.wifi.ssid) {
      return adminT.value.qrHub.enterWifiSsid
    }
    return null
  })

  // Initialize form from settings
  const initializeForm = () => {
    formData.value = JSON.parse(JSON.stringify(settings.value))
  }

  // Load settings on mount
  onMounted(async () => {
    await fetchSettingsAdmin(weddingId.value ?? undefined)
    initializeForm()
  })

  // Watch for external settings changes
  watch(
    () => settings.value,
    () => {
      if (!hasChanges.value) {
        initializeForm()
      }
    },
    { deep: true }
  )

  // Toggle section expansion
  const toggleSection = (section: string) => {
    expandedSection.value = expandedSection.value === section ? null : section
  }

  // Toggle QR code enabled state
  const toggleQRCode = (type: QRCodeType) => {
    if (type === 'website') {
      formData.value.website.enabled = !formData.value.website.enabled
    } else if (type === 'restuDigital') {
      formData.value.restuDigital.enabled = !formData.value.restuDigital.enabled
    } else if (type === 'location') {
      formData.value.location.enabled = !formData.value.location.enabled
    } else if (type === 'wifi') {
      formData.value.wifi.enabled = !formData.value.wifi.enabled
    } else if (type === 'rsvp') {
      formData.value.rsvp.enabled = !formData.value.rsvp.enabled
    } else if (type === 'calendar') {
      formData.value.calendar.enabled = !formData.value.calendar.enabled
    } else if (type === 'hashtag') {
      formData.value.hashtag.enabled = !formData.value.hashtag.enabled
    }
    saveSuccess.value = false
  }

  // Handle file upload for Restu Digital QR image
  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    const publicUrl = await uploadRestuDigitalImage(file, weddingId.value ?? undefined)
    if (publicUrl) {
      formData.value.restuDigital.qrImageUrl = publicUrl
      saveSuccess.value = false
    }

    // Reset file input
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.value?.click()
  }

  // Cancel changes
  const cancelChanges = () => {
    initializeForm()
    saveSuccess.value = false
  }

  // Save settings
  const handleSave = async () => {
    saveSuccess.value = false

    const updateData: QRCodeHubUpdateRequest = {
      hubEnabled: formData.value.hubEnabled,
      website: formData.value.website,
      restuDigital: formData.value.restuDigital,
      location: formData.value.location,
      wifi: formData.value.wifi,
      rsvp: formData.value.rsvp,
      calendar: formData.value.calendar,
      hashtag: formData.value.hashtag,
      displayOrder: formData.value.displayOrder,
    }

    await withLoading(
      async () => {
        await saveSettings(updateData, weddingId.value ?? undefined)
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-heading text-xl font-semibold text-gray-900">{{ adminT.qrHub.title }}</h2>
        <p class="mt-1 font-body text-sm text-gray-500">
          {{ adminT.qrHub.subtitle }}
        </p>
      </div>

      <!-- Master Toggle -->
      <label class="flex cursor-pointer items-center gap-3">
        <span class="font-body text-sm text-gray-600">
          {{ formData.hubEnabled ? adminT.common.enabled : adminT.common.disabled }}
        </span>
        <div class="relative">
          <input
            v-model="formData.hubEnabled"
            type="checkbox"
            class="sr-only"
            @change="saveSuccess = false"
          />
          <div
            class="h-6 w-11 rounded-full transition-colors"
            :class="formData.hubEnabled ? 'bg-green-500' : 'bg-gray-300'"
          ></div>
          <div
            class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
            :class="formData.hubEnabled ? 'translate-x-5' : ''"
          ></div>
        </div>
      </label>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-8 text-center">
      <div
        class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
      ></div>
      <p class="mt-2 font-body text-sm text-gray-500">{{ adminT.qrHub.loadingSettings }}</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="loadError"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600"
    >
      {{ loadError }}
    </div>

    <!-- Content -->
    <div v-else class="space-y-4">
      <!-- QR Code Cards Grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="type in formData.displayOrder"
          :key="type"
          class="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          :class="{
            'border-green-300 bg-green-50':
              (type === 'website' && formData.website.enabled) ||
              (type === 'restuDigital' && formData.restuDigital.enabled) ||
              (type === 'location' && formData.location.enabled) ||
              (type === 'wifi' && formData.wifi.enabled) ||
              (type === 'rsvp' && formData.rsvp.enabled) ||
              (type === 'calendar' && formData.calendar.enabled) ||
              (type === 'hashtag' && formData.hashtag.enabled),
            'border-gray-200':
              (type === 'website' && !formData.website.enabled) ||
              (type === 'restuDigital' && !formData.restuDigital.enabled) ||
              (type === 'location' && !formData.location.enabled) ||
              (type === 'wifi' && !formData.wifi.enabled) ||
              (type === 'rsvp' && !formData.rsvp.enabled) ||
              (type === 'calendar' && !formData.calendar.enabled) ||
              (type === 'hashtag' && !formData.hashtag.enabled),
          }"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ qrTypeLabels[type].icon }}</span>
              <div>
                <h3 class="font-heading text-sm font-medium text-gray-900">
                  {{ qrTypeLabels[type].title }}
                </h3>
                <p class="font-body text-xs text-gray-500">
                  {{ qrTypeLabels[type].subtitle }}
                </p>
              </div>
            </div>

            <!-- Toggle -->
            <label class="flex cursor-pointer items-center">
              <input
                type="checkbox"
                class="sr-only"
                :checked="
                  (type === 'website' && formData.website.enabled) ||
                  (type === 'restuDigital' && formData.restuDigital.enabled) ||
                  (type === 'location' && formData.location.enabled) ||
                  (type === 'wifi' && formData.wifi.enabled) ||
                  (type === 'rsvp' && formData.rsvp.enabled) ||
                  (type === 'calendar' && formData.calendar.enabled) ||
                  (type === 'hashtag' && formData.hashtag.enabled)
                "
                @change="toggleQRCode(type)"
              />
              <div
                class="relative h-5 w-9 rounded-full transition-colors"
                :class="
                  (type === 'website' && formData.website.enabled) ||
                  (type === 'restuDigital' && formData.restuDigital.enabled) ||
                  (type === 'location' && formData.location.enabled) ||
                  (type === 'wifi' && formData.wifi.enabled) ||
                  (type === 'rsvp' && formData.rsvp.enabled) ||
                  (type === 'calendar' && formData.calendar.enabled) ||
                  (type === 'hashtag' && formData.hashtag.enabled)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                "
              >
                <div
                  class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                  :class="
                    (type === 'website' && formData.website.enabled) ||
                    (type === 'restuDigital' && formData.restuDigital.enabled) ||
                    (type === 'location' && formData.location.enabled) ||
                    (type === 'wifi' && formData.wifi.enabled) ||
                    (type === 'rsvp' && formData.rsvp.enabled) ||
                    (type === 'calendar' && formData.calendar.enabled) ||
                    (type === 'hashtag' && formData.hashtag.enabled)
                      ? 'translate-x-4'
                      : ''
                  "
                ></div>
              </div>
            </label>
          </div>

          <!-- Warning indicator -->
          <p
            v-if="type === 'restuDigital' && restuDigitalWarning"
            class="mt-2 font-body text-xs text-amber-600"
          >
            ⚠️ {{ restuDigitalWarning }}
          </p>
          <p v-if="type === 'wifi' && wifiWarning" class="mt-2 font-body text-xs text-amber-600">
            ⚠️ {{ wifiWarning }}
          </p>

          <!-- Hashtag info note -->
          <p
            v-if="type === 'hashtag' && formData.hashtag.enabled"
            class="mt-2 font-body text-xs text-blue-600"
          >
            ℹ️ {{ adminT.qrHub.hashtagNote }}
          </p>

          <!-- Configure button for complex types -->
          <button
            v-if="type === 'restuDigital' || type === 'wifi' || type === 'location'"
            class="mt-3 w-full rounded bg-gray-100 px-3 py-1.5 font-body text-xs text-gray-600 transition-colors hover:bg-gray-200"
            @click="toggleSection(type)"
          >
            {{ expandedSection === type ? adminT.qrHub.close : adminT.qrHub.configure }}
          </button>
        </div>
      </div>

      <!-- Restu Digital Configuration -->
      <Transition name="config-expand">
        <div
          v-if="expandedSection === 'restuDigital'"
          class="rounded-lg border border-blue-200 bg-blue-50 p-4"
        >
          <h3 class="mb-4 font-heading text-lg font-medium text-gray-900">
            {{ adminT.qrHub.digitalBlessingConfig }}
          </h3>

          <p class="mb-4 font-body text-sm italic text-gray-600">
            "{{ formData.restuDigital.tagline || DEFAULT_RESTU_TAGLINE }}"
          </p>

          <!-- Tagline -->
          <div class="mb-4">
            <label class="mb-1 block font-body text-sm font-medium text-gray-700">
              {{ adminT.qrHub.taglineMessage }}
            </label>
            <input
              v-model="formData.restuDigital.tagline"
              type="text"
              class="w-full rounded-md border border-gray-300 px-3 py-2 font-body text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              :placeholder="DEFAULT_RESTU_TAGLINE"
              @input="saveSuccess = false"
            />
          </div>

          <!-- Use Image or Bank Details -->
          <div class="mb-4">
            <label class="mb-2 block font-body text-sm font-medium text-gray-700">
              {{ adminT.qrHub.qrDisplayMethod }}
            </label>
            <div class="flex gap-4">
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="formData.restuDigital.useImage"
                  type="radio"
                  :value="true"
                  class="text-blue-500 focus:ring-blue-500"
                  @change="saveSuccess = false"
                />
                <span class="font-body text-sm">{{ adminT.qrHub.uploadQrImage }}</span>
              </label>
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="formData.restuDigital.useImage"
                  type="radio"
                  :value="false"
                  class="text-blue-500 focus:ring-blue-500"
                  @change="saveSuccess = false"
                />
                <span class="font-body text-sm">{{ adminT.qrHub.enterBankDetails }}</span>
              </label>
            </div>
          </div>

          <!-- QR Image Upload -->
          <div v-if="formData.restuDigital.useImage" class="mb-4">
            <label class="mb-1 block font-body text-sm font-medium text-gray-700">
              {{ adminT.qrHub.qrImageFromBank }}
            </label>
            <div class="flex items-center gap-4">
              <div
                v-if="formData.restuDigital.qrImageUrl"
                class="h-24 w-24 overflow-hidden rounded-lg border bg-white"
              >
                <img
                  :src="formData.restuDigital.qrImageUrl"
                  alt="QR Code"
                  class="h-full w-full object-contain"
                />
              </div>
              <div>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  @change="handleFileSelect"
                />
                <button
                  class="rounded bg-blue-500 px-4 py-2 font-body text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                  :disabled="isUploading"
                  @click="triggerFileUpload"
                >
                  {{
                    isUploading
                      ? adminT.qrHub.uploading.replace('{progress}', String(uploadProgress))
                      : adminT.qrHub.uploadImage
                  }}
                </button>
                <p v-if="uploadError" class="mt-1 font-body text-xs text-red-500">
                  {{ uploadError }}
                </p>
              </div>
            </div>
          </div>

          <!-- Bank Details -->
          <div v-else class="space-y-3">
            <div>
              <label class="mb-1 block font-body text-sm font-medium text-gray-700">
                {{ adminT.qrHub.bankName }}
              </label>
              <input
                v-model="formData.restuDigital.bankName"
                type="text"
                class="w-full rounded-md border border-gray-300 px-3 py-2 font-body text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Maybank, CIMB, Bank Islam"
                @input="saveSuccess = false"
              />
            </div>
            <div>
              <label class="mb-1 block font-body text-sm font-medium text-gray-700">
                {{ adminT.qrHub.accountHolderName }}
              </label>
              <input
                v-model="formData.restuDigital.bankAccountName"
                type="text"
                class="w-full rounded-md border border-gray-300 px-3 py-2 font-body text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Ahmad bin Abu"
                @input="saveSuccess = false"
              />
            </div>
            <div>
              <label class="mb-1 block font-body text-sm font-medium text-gray-700">
                {{ adminT.qrHub.accountNumber }}
              </label>
              <input
                v-model="formData.restuDigital.bankAccountNumber"
                type="text"
                class="w-full rounded-md border border-gray-300 px-3 py-2 font-body text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. 1234567890"
                @input="saveSuccess = false"
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- WiFi Configuration -->
      <Transition name="config-expand">
        <div
          v-if="expandedSection === 'wifi'"
          class="rounded-lg border border-blue-200 bg-blue-50 p-4"
        >
          <h3 class="mb-4 font-heading text-lg font-medium text-gray-900">
            {{ adminT.qrHub.wifiConfiguration }}
          </h3>

          <div class="space-y-3">
            <div>
              <label class="mb-1 block font-body text-sm font-medium text-gray-700">
                {{ adminT.qrHub.networkNameSsid }}
              </label>
              <input
                v-model="formData.wifi.ssid"
                type="text"
                class="w-full rounded-md border border-gray-300 px-3 py-2 font-body text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Venue_WiFi"
                @input="saveSuccess = false"
              />
            </div>
            <div>
              <label class="mb-1 block font-body text-sm font-medium text-gray-700">
                {{ adminT.qrHub.password }}
              </label>
              <input
                v-model="formData.wifi.password"
                type="text"
                class="w-full rounded-md border border-gray-300 px-3 py-2 font-body text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="WiFi password"
                @input="saveSuccess = false"
              />
              <p class="mt-1 font-body text-xs text-amber-600">
                ⚠️ {{ adminT.qrHub.passwordVisibleWarning }}
              </p>
            </div>
            <div>
              <label class="mb-1 block font-body text-sm font-medium text-gray-700">
                {{ adminT.qrHub.encryptionType }}
              </label>
              <select
                v-model="formData.wifi.encryption"
                class="w-full rounded-md border border-gray-300 px-3 py-2 font-body text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                @change="saveSuccess = false"
              >
                <option v-for="enc in VALID_WIFI_ENCRYPTIONS" :key="enc" :value="enc">
                  {{ wifiEncryptionLabels[enc] }}
                </option>
              </select>
            </div>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="formData.wifi.hidden"
                type="checkbox"
                class="rounded text-blue-500 focus:ring-blue-500"
                @change="saveSuccess = false"
              />
              <span class="font-body text-sm text-gray-700">{{ adminT.qrHub.hiddenNetwork }}</span>
            </label>
          </div>
        </div>
      </Transition>

      <!-- Location Configuration -->
      <Transition name="config-expand">
        <div
          v-if="expandedSection === 'location'"
          class="rounded-lg border border-blue-200 bg-blue-50 p-4"
        >
          <h3 class="mb-4 font-heading text-lg font-medium text-gray-900">
            {{ adminT.qrHub.locationConfiguration }}
          </h3>

          <div>
            <label class="mb-2 block font-body text-sm font-medium text-gray-700">
              {{ adminT.qrHub.navigationApp }}
            </label>
            <div class="space-y-2">
              <label
                v-for="app in VALID_LOCATION_APPS"
                :key="app"
                class="flex cursor-pointer items-center gap-2"
              >
                <input
                  v-model="formData.location.preferredApp"
                  type="radio"
                  :value="app"
                  class="text-blue-500 focus:ring-blue-500"
                  @change="saveSuccess = false"
                />
                <span class="font-body text-sm">{{ locationAppLabels[app] }}</span>
              </label>
            </div>
            <p class="mt-2 font-body text-xs text-gray-500">
              {{ adminT.qrHub.locationFromVenue }}
            </p>
          </div>
        </div>
      </Transition>

      <!-- Save/Cancel Buttons -->
      <div
        v-if="hasChanges"
        class="flex items-center justify-end gap-3 border-t border-gray-200 pt-4"
      >
        <button
          class="rounded-md border border-gray-300 bg-white px-4 py-2 font-body text-sm text-gray-700 transition-colors hover:bg-gray-50"
          :disabled="isSaving"
          @click="cancelChanges"
        >
          {{ adminT.common.cancel }}
        </button>
        <button
          class="rounded-md bg-blue-500 px-4 py-2 font-body text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          :disabled="isSaving"
          @click="handleSave"
        >
          {{ isSaving ? adminT.common.saving : adminT.qrHub.saveSettings }}
        </button>
      </div>

      <!-- Save Error -->
      <div
        v-if="saveError"
        class="rounded-lg border border-red-200 bg-red-50 p-3 text-center font-body text-sm text-red-600"
      >
        {{ saveError }}
      </div>

      <!-- Save Success -->
      <div
        v-if="saveSuccess"
        class="rounded-lg border border-green-200 bg-green-50 p-3 text-center font-body text-sm text-green-600"
      >
        ✓ {{ adminT.qrHub.savedSuccess }}
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Configuration panel expand/collapse transition */
  .config-expand-enter-active,
  .config-expand-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .config-expand-enter-from,
  .config-expand-leave-to {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
  }

  .config-expand-enter-to,
  .config-expand-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 600px;
  }
</style>
