<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import QRCode from 'qrcode'
  import { useLanguage } from '@/composables/useLanguage'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'
  import { getQRCodeHubCached, getVenueCached } from '@/services/api'
  import type { QRCodeHubSettings, QRCodeType } from '@/types/qrCodeHub'
  import { DEFAULT_QRCODE_HUB_SETTINGS, DEFAULT_RESTU_TAGLINE } from '@/types/qrCodeHub'
  import type { VenueData } from '@/types/venue'
  import {
    generateWifiQRData,
    generateGoogleMapsUrl,
    generateWazeUrl,
    generateRsvpUrl,
    generateCalendarUrl,
    generateHashtagUrl,
  } from '@/utils/qrCodeFormats'

  const { currentLanguage } = useLanguage()
  const { getQrCodeUrl, weddingDetails, currentWeddingSlug } = usePublicWeddingData()

  // State
  const settings = ref<QRCodeHubSettings>({ ...DEFAULT_QRCODE_HUB_SETTINGS })
  const venueData = ref<VenueData | null>(null)
  const isLoading = ref(true)
  const qrCodes = ref<Map<string, string>>(new Map())
  const isModalOpen = ref(false)
  const modalQRCode = ref<string>('')
  const modalTitle = ref<string>('')
  const modalSubtitle = ref<string>('')
  const modalType = ref<QRCodeType | null>(null)
  const linkCopied = ref(false)

  // QR Code type info
  const qrTypeInfo: Record<
    QRCodeType,
    { icon: string; titleMs: string; titleEn: string; subtitleMs: string; subtitleEn: string }
  > = {
    website: {
      icon: '🌐',
      titleMs: 'Laman Web',
      titleEn: 'Website',
      subtitleMs: 'Kongsi jemputan',
      subtitleEn: 'Share invitation',
    },
    restuDigital: {
      icon: '💝',
      titleMs: 'Restu Digital',
      titleEn: 'Digital Blessing',
      subtitleMs: 'Restu anda bermakna',
      subtitleEn: 'Your blessing matters',
    },
    location: {
      icon: '📍',
      titleMs: 'Lokasi',
      titleEn: 'Location',
      subtitleMs: 'Navigasi ke majlis',
      subtitleEn: 'Navigate to venue',
    },
    wifi: {
      icon: '📶',
      titleMs: 'WiFi',
      titleEn: 'WiFi',
      subtitleMs: 'Sambung ke internet',
      subtitleEn: 'Connect to internet',
    },
    rsvp: {
      icon: '✉️',
      titleMs: 'RSVP',
      titleEn: 'RSVP',
      subtitleMs: 'Kongsi pautan RSVP',
      subtitleEn: 'Share RSVP link',
    },
    calendar: {
      icon: '📅',
      titleMs: 'Kalendar',
      titleEn: 'Calendar',
      subtitleMs: 'Simpan tarikh',
      subtitleEn: 'Save the date',
    },
    hashtag: {
      icon: '📸',
      titleMs: 'Instagram',
      titleEn: 'Instagram',
      subtitleMs: 'Buka carian hashtag',
      subtitleEn: 'Open hashtag search',
    },
  }

  // Get QR code data URL for a type
  const getQRCodeData = (type: QRCodeType): string | null => {
    const websiteUrl = getQrCodeUrl()

    switch (type) {
      case 'website':
        return websiteUrl

      case 'restuDigital':
        // If using image, return the image URL directly
        if (settings.value.restuDigital.useImage && settings.value.restuDigital.qrImageUrl) {
          return null // Will use image directly
        }
        // If using bank details, generate a URL or text
        if (
          settings.value.restuDigital.bankName &&
          settings.value.restuDigital.bankAccountName &&
          settings.value.restuDigital.bankAccountNumber
        ) {
          // For bank details, we'll show info instead of QR
          return `Bank: ${settings.value.restuDigital.bankName}\nNama: ${settings.value.restuDigital.bankAccountName}\nNo. Akaun: ${settings.value.restuDigital.bankAccountNumber}`
        }
        return null

      case 'location':
        if (!venueData.value?.coordinates) return null
        const { lat, lng } = venueData.value.coordinates
        if (settings.value.location.preferredApp === 'waze') {
          return generateWazeUrl(lat, lng)
        }
        return generateGoogleMapsUrl(lat, lng)

      case 'wifi':
        if (!settings.value.wifi.ssid) return null
        return generateWifiQRData(
          settings.value.wifi.ssid,
          settings.value.wifi.password,
          settings.value.wifi.encryption,
          settings.value.wifi.hidden
        )

      case 'rsvp':
        return generateRsvpUrl(websiteUrl)

      case 'calendar':
        if (!weddingDetails.value?.eventDate) return null
        const eventDate = new Date(weddingDetails.value.eventDate)
        const endDate = weddingDetails.value.eventEndTime
          ? new Date(weddingDetails.value.eventEndTime)
          : new Date(eventDate.getTime() + 4 * 60 * 60 * 1000) // Default 4 hours
        return generateCalendarUrl(
          'Wedding Invitation',
          eventDate,
          endDate,
          venueData.value?.venueName || ''
        )

      case 'hashtag':
        if (!weddingDetails.value?.hashtag) return null
        return generateHashtagUrl(weddingDetails.value.hashtag)

      default:
        return null
    }
  }

  // Generate QR code image for a type
  const generateQRCodeImage = async (type: QRCodeType, data: string): Promise<string | null> => {
    try {
      return await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#333333',
          light: '#FFFFFF',
        },
      })
    } catch (error) {
      console.error(`Failed to generate QR code for ${type}:`, error)
      return null
    }
  }

  // Generate all QR codes
  const generateAllQRCodes = async (): Promise<void> => {
    const newQRCodes = new Map<string, string>()

    for (const type of settings.value.displayOrder) {
      const isEnabled =
        (type === 'website' && settings.value.website.enabled) ||
        (type === 'restuDigital' && settings.value.restuDigital.enabled) ||
        (type === 'location' && settings.value.location.enabled) ||
        (type === 'wifi' && settings.value.wifi.enabled) ||
        (type === 'rsvp' && settings.value.rsvp.enabled) ||
        (type === 'calendar' && settings.value.calendar.enabled) ||
        (type === 'hashtag' && settings.value.hashtag.enabled)

      if (!isEnabled) continue

      // Special handling for Restu Digital with image
      if (type === 'restuDigital' && settings.value.restuDigital.useImage) {
        if (settings.value.restuDigital.qrImageUrl) {
          newQRCodes.set(type, settings.value.restuDigital.qrImageUrl)
        }
        continue
      }

      const data = getQRCodeData(type)
      if (data) {
        const qrImage = await generateQRCodeImage(type, data)
        if (qrImage) {
          newQRCodes.set(type, qrImage)
        }
      }
    }

    qrCodes.value = newQRCodes
  }

  // Get enabled QR types in display order
  const enabledQRTypes = computed(() => {
    return settings.value.displayOrder.filter((type) => {
      switch (type) {
        case 'website':
          return settings.value.website.enabled
        case 'restuDigital':
          return settings.value.restuDigital.enabled
        case 'location':
          return settings.value.location.enabled
        case 'wifi':
          return settings.value.wifi.enabled
        case 'rsvp':
          return settings.value.rsvp.enabled
        case 'calendar':
          return settings.value.calendar.enabled
        case 'hashtag':
          return settings.value.hashtag.enabled
        default:
          return false
      }
    })
  })

  // Open modal with large QR code
  const openModal = async (type: QRCodeType): Promise<void> => {
    modalType.value = type
    const info = qrTypeInfo[type]
    modalTitle.value = currentLanguage.value === 'ms' ? info.titleMs : info.titleEn
    modalSubtitle.value = currentLanguage.value === 'ms' ? info.subtitleMs : info.subtitleEn

    // Generate large QR code
    if (type === 'restuDigital' && settings.value.restuDigital.useImage) {
      modalQRCode.value = settings.value.restuDigital.qrImageUrl || ''
    } else {
      const data = getQRCodeData(type)
      if (data) {
        try {
          modalQRCode.value = await QRCode.toDataURL(data, {
            width: 400,
            margin: 2,
            color: {
              dark: '#333333',
              light: '#FFFFFF',
            },
          })
        } catch (error) {
          console.error('Failed to generate large QR code:', error)
        }
      }
    }

    isModalOpen.value = true
    document.body.style.overflow = 'hidden'
  }

  const closeModal = (): void => {
    isModalOpen.value = false
    modalType.value = null
    document.body.style.overflow = ''
  }

  const handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && isModalOpen.value) {
      closeModal()
    }
  }

  // Download QR code
  const downloadQRCode = (): void => {
    if (!modalQRCode.value || !modalType.value) return

    const link = document.createElement('a')
    link.download = `${modalType.value}-qr-code.png`
    link.href = modalQRCode.value
    link.click()
  }

  // Share QR code
  const shareQRCode = async (): Promise<void> => {
    const data = modalType.value ? getQRCodeData(modalType.value) : null
    if (!data) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: modalTitle.value,
          text: modalSubtitle.value,
          ...(data.startsWith('http') ? { url: data } : {}),
        })
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(data)
      linkCopied.value = true
      setTimeout(() => {
        linkCopied.value = false
      }, 2000)
    }
  }

  // Load settings
  const loadSettings = async (): Promise<void> => {
    isLoading.value = true
    try {
      const slug = currentWeddingSlug.value ?? undefined
      const [hubSettings, venue] = await Promise.all([
        getQRCodeHubCached(slug),
        getVenueCached(slug),
      ])
      settings.value = hubSettings
      venueData.value = venue
      await generateAllQRCodes()
    } catch (error) {
      console.error('Failed to load QR Code Hub settings:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Watch for wedding details changes
  watch(
    () => weddingDetails.value,
    () => {
      if (!isLoading.value) {
        generateAllQRCodes()
      }
    },
    { deep: true }
  )

  onMounted(() => {
    loadSettings()
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
</script>

<template>
  <!-- Only show if hub is enabled and has enabled QR codes -->
  <section
    v-if="!isLoading && settings.hubEnabled && enabledQRTypes.length > 0"
    id="qr-hub"
    class="bg-cream px-4 py-12 dark:bg-dark-surface sm:px-6 lg:px-8"
  >
    <div class="mx-auto max-w-4xl">
      <!-- Section Header -->
      <div class="mb-8 text-center">
        <h2
          class="font-heading text-2xl font-semibold tracking-wide text-charcoal dark:text-dark-text sm:text-3xl"
        >
          {{ currentLanguage === 'ms' ? 'QR Code Hub' : 'QR Code Hub' }}
        </h2>
        <p class="mt-2 font-body text-charcoal-light dark:text-dark-text-secondary">
          {{ currentLanguage === 'ms' ? 'Imbas untuk akses pantas' : 'Scan for quick access' }}
        </p>
      </div>

      <!-- Restu Digital Tagline (if enabled) -->
      <p
        v-if="settings.restuDigital.enabled"
        class="mb-6 text-center font-body text-sm italic text-charcoal-light dark:text-dark-text-secondary"
      >
        "{{ settings.restuDigital.tagline || DEFAULT_RESTU_TAGLINE }}"
      </p>

      <!-- QR Codes Grid -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="type in enabledQRTypes"
          :key="type"
          class="flex cursor-pointer flex-col items-center rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-dark-card"
          @click="openModal(type)"
        >
          <!-- QR Code Image -->
          <div class="mb-3 h-24 w-24 overflow-hidden rounded-lg bg-white">
            <img
              v-if="qrCodes.get(type)"
              :src="qrCodes.get(type)"
              :alt="`${qrTypeInfo[type].titleEn} QR Code`"
              class="h-full w-full object-contain"
            />
            <div v-else class="flex h-full items-center justify-center">
              <span class="text-3xl">{{ qrTypeInfo[type].icon }}</span>
            </div>
          </div>

          <!-- Label -->
          <span class="text-xl">{{ qrTypeInfo[type].icon }}</span>
          <h3 class="mt-1 font-heading text-sm font-medium text-charcoal dark:text-dark-text">
            {{ currentLanguage === 'ms' ? qrTypeInfo[type].titleMs : qrTypeInfo[type].titleEn }}
          </h3>
          <p
            class="text-center font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
          >
            {{
              currentLanguage === 'ms' ? qrTypeInfo[type].subtitleMs : qrTypeInfo[type].subtitleEn
            }}
          </p>
          <!-- Show hashtag hint - full value shown in modal -->
          <p
            v-if="type === 'hashtag' && weddingDetails?.hashtag"
            class="mt-1 font-body text-xs italic text-charcoal-light dark:text-dark-text-secondary"
          >
            {{ currentLanguage === 'ms' ? 'Ketik untuk lihat' : 'Tap to view' }}
          </p>
          <!-- RSVP sharing note -->
          <p
            v-if="type === 'rsvp'"
            class="mt-1 font-body text-xs italic text-charcoal-light dark:text-dark-text-secondary"
          >
            {{ currentLanguage === 'ms' ? 'Untuk dikongsi' : 'For sharing' }}
          </p>
        </div>
      </div>

      <!-- Location: Show both Google Maps and Waze if 'both' is selected -->
      <div
        v-if="settings.location.enabled && settings.location.preferredApp === 'both' && venueData"
        class="mt-6 flex justify-center gap-4"
      >
        <a
          :href="generateGoogleMapsUrl(venueData.coordinates.lat, venueData.coordinates.lng)"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-body text-sm text-charcoal shadow-sm transition-shadow hover:shadow-md dark:bg-dark-card dark:text-dark-text"
        >
          📍 Google Maps
        </a>
        <a
          :href="generateWazeUrl(venueData.coordinates.lat, venueData.coordinates.lng)"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-body text-sm text-charcoal shadow-sm transition-shadow hover:shadow-md dark:bg-dark-card dark:text-dark-text"
        >
          🚗 Waze
        </a>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal-backdrop">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          @click.self="closeModal"
        >
          <Transition name="modal-content" appear>
            <div
              class="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-card"
            >
              <!-- Close button -->
              <button
                class="absolute right-3 top-3 rounded-full p-1 text-charcoal-light transition-colors hover:bg-gray-100 hover:text-charcoal dark:text-dark-text-secondary dark:hover:bg-dark-surface"
                @click="closeModal"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <!-- Content -->
              <div class="text-center">
                <h3 class="font-heading text-lg font-semibold text-charcoal dark:text-dark-text">
                  {{ modalTitle }}
                </h3>
                <p class="mt-1 font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                  {{ modalSubtitle }}
                </p>

                <!-- Large QR Code -->
                <div class="mx-auto my-4 h-64 w-64 overflow-hidden rounded-lg bg-white p-2">
                  <img
                    v-if="modalQRCode"
                    :src="modalQRCode"
                    alt="QR Code"
                    class="h-full w-full object-contain"
                  />
                </div>

                <!-- Bank Details (for Restu Digital without image) -->
                <div
                  v-if="
                    modalType === 'restuDigital' &&
                    !settings.restuDigital.useImage &&
                    settings.restuDigital.bankName
                  "
                  class="mb-4 rounded-lg bg-gray-50 p-3 text-left dark:bg-dark-surface"
                >
                  <p class="font-body text-sm text-charcoal dark:text-dark-text">
                    <strong>Bank:</strong> {{ settings.restuDigital.bankName }}
                  </p>
                  <p class="font-body text-sm text-charcoal dark:text-dark-text">
                    <strong>Nama:</strong> {{ settings.restuDigital.bankAccountName }}
                  </p>
                  <p class="font-body text-sm text-charcoal dark:text-dark-text">
                    <strong>No. Akaun:</strong> {{ settings.restuDigital.bankAccountNumber }}
                  </p>
                </div>

                <!-- Instagram Hashtag Info -->
                <div
                  v-if="modalType === 'hashtag' && weddingDetails?.hashtag"
                  class="mb-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-3 dark:from-purple-900/20 dark:to-pink-900/20"
                >
                  <p class="font-heading text-lg font-semibold text-charcoal dark:text-dark-text">
                    #{{ weddingDetails.hashtag.replace(/^#/, '') }}
                  </p>
                  <p
                    class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                  >
                    {{
                      currentLanguage === 'ms'
                        ? 'Imbas untuk buka Instagram'
                        : 'Scan to open Instagram'
                    }}
                  </p>
                </div>

                <!-- RSVP Info -->
                <div
                  v-if="modalType === 'rsvp'"
                  class="mb-4 rounded-lg bg-sage/10 p-3 dark:bg-sage/20"
                >
                  <p class="font-body text-sm text-charcoal dark:text-dark-text">
                    {{
                      currentLanguage === 'ms'
                        ? 'QR ini untuk dikongsi kepada tetamu lain.'
                        : 'This QR is for sharing with other guests.'
                    }}
                  </p>
                  <p
                    class="mt-2 font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                  >
                    {{
                      currentLanguage === 'ms'
                        ? 'Sudah di laman ini? Tatal ke bawah ke bahagian RSVP atau klik butang RSVP.'
                        : 'Already on this page? Scroll down to RSVP section or click the RSVP button.'
                    }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex justify-center gap-3">
                  <button
                    class="flex items-center gap-2 rounded-full bg-sage px-4 py-2 font-body text-sm text-white transition-colors hover:bg-sage-dark"
                    @click="downloadQRCode"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    {{ currentLanguage === 'ms' ? 'Muat Turun' : 'Download' }}
                  </button>

                  <button
                    class="flex items-center gap-2 rounded-full border border-sage px-4 py-2 font-body text-sm text-sage transition-colors hover:bg-sage hover:text-white"
                    @click="shareQRCode"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    {{
                      linkCopied
                        ? currentLanguage === 'ms'
                          ? 'Disalin!'
                          : 'Copied!'
                        : currentLanguage === 'ms'
                          ? 'Kongsi'
                          : 'Share'
                    }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
  /* Modal backdrop transition */
  .modal-backdrop-enter-active,
  .modal-backdrop-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-backdrop-enter-from,
  .modal-backdrop-leave-to {
    opacity: 0;
  }

  /* Modal content transition */
  .modal-content-enter-active,
  .modal-content-leave-active {
    transition: all 0.3s ease;
  }

  .modal-content-enter-from,
  .modal-content-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }

  .modal-content-enter-to,
  .modal-content-leave-from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
</style>
