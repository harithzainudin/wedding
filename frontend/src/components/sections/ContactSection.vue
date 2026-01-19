<script setup lang="ts">
  import { computed } from 'vue'
  import { useLanguage } from '@/composables/useLanguage'
  import { usePublicWeddingData } from '@/composables/usePublicWeddingData'
  import { useNameOrder } from '@/composables/useNameOrder'
  import type { ContactPerson } from '@/types/contacts'

  const { t, currentLanguage } = useLanguage()
  const { getContactsMultilingual, isLoadingContacts, contactsData } = usePublicWeddingData()
  const { getOrderedNicknamesString } = useNameOrder()

  // Check if contacts section should be shown (default to true)
  const showContacts = computed(() => contactsData.value?.settings?.showContacts ?? true)

  const contacts = computed(() => getContactsMultilingual())

  const getCleanPhone = (phone: string): string => {
    return phone.replace(/[^0-9+]/g, '')
  }

  // Get role based on current language
  const getContactRole = (contact: ContactPerson): string => {
    const lang = currentLanguage.value as keyof typeof contact.role
    return contact.role[lang] || contact.role.ms
  }

  const openWhatsApp = (phone: string): void => {
    const cleanPhone = getCleanPhone(phone)
    const coupleNames = getOrderedNicknamesString(' & ')
    const message = encodeURIComponent(
      t.value.contact.whatsappMessage.replace('{couple}', coupleNames)
    )
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  const callPhone = (phone: string): void => {
    window.location.href = `tel:${getCleanPhone(phone)}`
  }
</script>

<template>
  <section
    v-if="showContacts"
    class="py-12 sm:py-16 px-4 sm:px-6 bg-sand dark:bg-dark-bg transition-colors duration-300"
  >
    <div class="max-w-xl mx-auto text-center">
      <h2
        class="font-heading text-xl sm:text-2xl md:text-3xl text-sage-dark dark:text-sage-light mb-2"
      >
        {{ t.contact.title }}
      </h2>
      <p
        class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary mb-6 sm:mb-8"
      >
        {{ t.contact.subtitle }}
      </p>

      <!-- Loading Skeleton -->
      <div v-if="isLoadingContacts" class="grid gap-3 sm:gap-4">
        <div
          v-for="i in 3"
          :key="i"
          class="flex items-center gap-3 sm:gap-4 p-4 bg-white dark:bg-dark-bg-elevated rounded-xl shadow-sm dark:shadow-lg animate-pulse"
        >
          <div class="flex-1 space-y-2">
            <div class="h-5 sm:h-6 w-32 bg-charcoal/10 dark:bg-dark-text/10 rounded"></div>
            <div class="h-4 w-24 bg-charcoal/5 dark:bg-dark-text/5 rounded"></div>
          </div>
          <div class="flex gap-2">
            <div class="w-11 h-11 sm:w-12 sm:h-12 bg-sage/30 rounded-full"></div>
            <div class="w-11 h-11 sm:w-12 sm:h-12 bg-[#25D366]/30 rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="contacts.length === 0"
        class="py-6 px-4 rounded-lg bg-charcoal/5 dark:bg-dark-text/5 border border-dashed border-charcoal/20 dark:border-dark-text/20"
      >
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary italic">
          {{ t.placeholder?.contactInfo ?? 'No contacts added yet' }}
        </p>
      </div>

      <!-- Actual Contacts -->
      <div v-else class="grid gap-3 sm:gap-4">
        <div
          v-for="contact in contacts"
          :key="contact.id"
          class="flex items-center gap-3 sm:gap-4 p-4 bg-white dark:bg-dark-bg-elevated rounded-xl shadow-sm dark:shadow-lg"
        >
          <!-- Contact Info -->
          <div class="flex-1 text-left">
            <p class="font-heading text-base sm:text-lg text-charcoal dark:text-dark-text">
              {{ contact.name }}
            </p>
            <p
              class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary"
            >
              {{ getContactRole(contact) }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <!-- Call Button -->
            <button
              type="button"
              class="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-sage rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95"
              aria-label="Call"
              @click="callPhone(contact.phoneNumber)"
            >
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"
                />
              </svg>
            </button>

            <!-- WhatsApp Button -->
            <button
              type="button"
              class="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-[#25D366] rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95"
              aria-label="WhatsApp"
              @click="openWhatsApp(contact.phoneNumber)"
            >
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
