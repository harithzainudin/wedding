<script setup lang="ts">
import { weddingConfig } from "@/config/wedding";

const schedule = weddingConfig.event.schedule;
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 bg-white">
    <div class="max-w-xl mx-auto">
      <h2 class="font-heading text-xl sm:text-2xl md:text-3xl text-center text-sage-dark mb-6 sm:mb-8">
        Aturcara Majlis
      </h2>

      <div class="space-y-4 sm:space-y-6">
        <div
          v-for="(item, index) in schedule"
          :key="index"
          class="flex items-start gap-3 sm:gap-4"
        >
          <!-- Time -->
          <div class="flex-shrink-0 w-20 sm:w-24 text-right">
            <p class="font-heading text-base sm:text-lg text-sage-dark">
              {{ item.time }}
            </p>
          </div>

          <!-- Timeline Dot -->
          <div class="flex flex-col items-center">
            <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sage"></div>
            <div
              v-if="index < schedule.length - 1"
              class="w-0.5 h-10 sm:h-12 bg-sage/30"
            ></div>
          </div>

          <!-- Event Description -->
          <div class="flex-1 pb-4 sm:pb-6">
            <p class="font-heading text-base sm:text-lg text-charcoal">
              {{ item.titleMalay }}
            </p>
            <p class="font-body text-xs sm:text-sm text-charcoal-light">
              {{ item.title }}
            </p>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="mt-8 sm:mt-12 p-4 sm:p-6 bg-sand rounded-lg">
        <h3 class="font-heading text-lg sm:text-xl text-center text-sage-dark mb-3 sm:mb-4">
          Hubungi Kami
        </h3>
        <div class="flex flex-wrap justify-center gap-2 sm:gap-4">
          <a
            v-for="contact in weddingConfig.contacts"
            :key="contact.phone"
            :href="`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-full text-charcoal hover:text-sage transition-colors active:scale-95"
          >
            <svg class="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
              />
            </svg>
            <span class="font-body text-xs sm:text-sm">{{ contact.name }}</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
