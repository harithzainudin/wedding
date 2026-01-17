<script setup lang="ts">
  import { computed } from 'vue'
  import { useLanguage } from '@/composables/useLanguage'
  import type { WeddingErrorType } from '@/composables/usePublicWeddingData'

  const props = defineProps<{
    errorType: WeddingErrorType
  }>()

  const { t } = useLanguage()

  // Translations for different error types
  const errorContent = computed(() => {
    switch (props.errorType) {
      case 'archived':
        return {
          iconType: 'flower' as const,
          title: t.value.weddingUnavailable?.archivedTitle ?? 'Wedding Has Ended',
          titleMs: 'Majlis Telah Berakhir',
          message:
            t.value.weddingUnavailable?.archivedMessage ??
            'Thank you for your interest. This wedding celebration has concluded.',
          messageMs:
            'Terima kasih atas minat anda. Majlis perkahwinan ini telah selesai dijalankan.',
          accentColor: 'rose',
        }
      case 'draft':
        return {
          iconType: 'rings' as const,
          title: t.value.weddingUnavailable?.draftTitle ?? 'Coming Soon',
          titleMs: 'Akan Datang',
          message:
            t.value.weddingUnavailable?.draftMessage ??
            'This wedding invitation is being prepared with love. Please check back soon.',
          messageMs:
            'Jemputan perkahwinan ini sedang disediakan dengan penuh kasih sayang. Sila kembali tidak lama lagi.',
          accentColor: 'sage',
        }
      case 'not_found':
        return {
          iconType: 'search' as const,
          title: t.value.weddingUnavailable?.notFoundTitle ?? 'Wedding Not Found',
          titleMs: 'Majlis Tidak Dijumpai',
          message:
            t.value.weddingUnavailable?.notFoundMessage ??
            'We could not find the wedding you are looking for. Please check the link and try again.',
          messageMs:
            'Kami tidak dapat mencari majlis perkahwinan yang anda cari. Sila semak pautan dan cuba lagi.',
          accentColor: 'amber',
        }
      default:
        return {
          iconType: 'error' as const,
          title: t.value.weddingUnavailable?.errorTitle ?? 'Something Went Wrong',
          titleMs: 'Sesuatu Tidak Kena',
          message:
            t.value.weddingUnavailable?.errorMessage ??
            'We encountered an error loading this page. Please try again later.',
          messageMs: 'Kami menghadapi masalah memuatkan halaman ini. Sila cuba lagi kemudian.',
          accentColor: 'slate',
        }
    }
  })
</script>

<template>
  <main class="min-h-screen relative overflow-hidden">
    <!-- Elegant gradient background -->
    <div class="absolute inset-0 bg-gradient-to-br from-sand via-sand-light to-white"></div>

    <!-- Subtle pattern overlay -->
    <div
      class="absolute inset-0 opacity-[0.03]"
      style="
        background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;);
      "
    ></div>

    <!-- Decorative corner flourishes -->
    <div class="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 opacity-20">
      <svg viewBox="0 0 100 100" class="w-full h-full text-sage">
        <path
          d="M0,50 Q25,25 50,0 M0,70 Q35,35 70,0 M0,90 Q45,45 90,0"
          fill="none"
          stroke="currentColor"
          stroke-width="0.5"
        />
        <circle cx="15" cy="15" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="35" cy="8" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="8" cy="35" r="2" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
    <div class="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-20 rotate-90">
      <svg viewBox="0 0 100 100" class="w-full h-full text-sage">
        <path
          d="M0,50 Q25,25 50,0 M0,70 Q35,35 70,0 M0,90 Q45,45 90,0"
          fill="none"
          stroke="currentColor"
          stroke-width="0.5"
        />
        <circle cx="15" cy="15" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="35" cy="8" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="8" cy="35" r="2" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
    <div class="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 opacity-20 -rotate-90">
      <svg viewBox="0 0 100 100" class="w-full h-full text-sage">
        <path
          d="M0,50 Q25,25 50,0 M0,70 Q35,35 70,0 M0,90 Q45,45 90,0"
          fill="none"
          stroke="currentColor"
          stroke-width="0.5"
        />
        <circle cx="15" cy="15" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="35" cy="8" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="8" cy="35" r="2" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
    <div class="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-20 rotate-180">
      <svg viewBox="0 0 100 100" class="w-full h-full text-sage">
        <path
          d="M0,50 Q25,25 50,0 M0,70 Q35,35 70,0 M0,90 Q45,45 90,0"
          fill="none"
          stroke="currentColor"
          stroke-width="0.5"
        />
        <circle cx="15" cy="15" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="35" cy="8" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="8" cy="35" r="2" fill="currentColor" opacity="0.3" />
      </svg>
    </div>

    <!-- Main content -->
    <div class="relative z-10 min-h-screen flex items-center justify-center p-6 md:p-12">
      <!-- Card container -->
      <div
        class="w-full max-w-lg bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-sage/5 border border-sage/10 overflow-hidden animate-fade-in"
      >
        <!-- Top decorative border -->
        <div class="h-1 bg-gradient-to-r from-transparent via-sage to-transparent"></div>

        <!-- Card content -->
        <div class="p-8 md:p-12">
          <!-- Top ornament -->
          <div class="flex justify-center mb-8">
            <svg
              class="w-24 h-6 text-sage/40"
              viewBox="0 0 120 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 12h40M80 12h40"
                stroke="currentColor"
                stroke-width="0.5"
                stroke-dasharray="2 4"
              />
              <circle cx="60" cy="12" r="8" stroke="currentColor" stroke-width="0.5" fill="none" />
              <circle cx="60" cy="12" r="4" fill="currentColor" opacity="0.3" />
              <path
                d="M48 12a12 12 0 0 1 24 0"
                stroke="currentColor"
                stroke-width="0.5"
                fill="none"
              />
              <path
                d="M48 12a12 12 0 0 0 24 0"
                stroke="currentColor"
                stroke-width="0.5"
                fill="none"
              />
            </svg>
          </div>

          <!-- Icon -->
          <div class="flex justify-center mb-8">
            <!-- Wedding Rings Icon (Coming Soon / Draft) -->
            <div
              v-if="errorContent.iconType === 'rings'"
              class="w-20 h-20 rounded-full bg-gradient-to-br from-sage/10 to-sage/5 flex items-center justify-center"
            >
              <svg
                class="w-10 h-10 text-sage"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="9" cy="12" r="5" stroke="currentColor" stroke-width="1.5" fill="none" />
                <circle
                  cx="15"
                  cy="12"
                  r="5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                />
                <path
                  d="M12 8.5a5 5 0 0 1 0 7"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </div>

            <!-- Flower Icon (Archived / Ended) -->
            <div
              v-else-if="errorContent.iconType === 'flower'"
              class="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-rose-50 flex items-center justify-center"
            >
              <svg
                class="w-10 h-10 text-rose-400"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
                <path
                  d="M12 2c1.5 2 2 4 2 6s-0.5 4-2 6c-1.5-2-2-4-2-6s0.5-4 2-6z"
                  stroke="currentColor"
                  stroke-width="1"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M12 22c1.5-2 2-4 2-6s-0.5-4-2-6c-1.5 2-2 4-2 6s0.5 4 2 6z"
                  stroke="currentColor"
                  stroke-width="1"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M2 12c2 1.5 4 2 6 2s4-0.5 6-2c-2-1.5-4-2-6-2s-4 0.5-6 2z"
                  stroke="currentColor"
                  stroke-width="1"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M22 12c-2 1.5-4 2-6 2s-4-0.5-6-2c2-1.5 4-2 6-2s4 0.5 6 2z"
                  stroke="currentColor"
                  stroke-width="1"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M4.93 4.93c2.12 0.7 3.54 2.12 4.24 4.24s0.7 4.24-0.7 5.9c-0.7-2.12-2.12-3.54-4.24-4.24s-4.24-0.7-5.9 0.7c0.7 2.12 2.12 3.54 4.24 4.24"
                  stroke="currentColor"
                  stroke-width="1"
                  fill="none"
                />
              </svg>
            </div>

            <!-- Search Icon (Not Found) -->
            <div
              v-else-if="errorContent.iconType === 'search'"
              class="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center"
            >
              <svg
                class="w-10 h-10 text-amber-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                />
                <path
                  d="M11 8v6M8 11h6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  opacity="0.5"
                />
                <path
                  d="M16 16l4 4"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </div>

            <!-- Error Icon (Default) -->
            <div
              v-else
              class="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center"
            >
              <svg
                class="w-10 h-10 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                />
                <path d="M12 8v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
            </div>
          </div>

          <!-- Title -->
          <div class="text-center mb-6">
            <h1
              class="font-heading text-2xl md:text-3xl tracking-wide mb-2"
              :class="{
                'text-sage-dark': errorContent.iconType === 'rings',
                'text-rose-600': errorContent.iconType === 'flower',
                'text-amber-600': errorContent.iconType === 'search',
                'text-slate-600': errorContent.iconType === 'error',
              }"
            >
              {{ errorContent.title }}
            </h1>
            <p class="font-body text-base text-charcoal-light italic">
              {{ errorContent.titleMs }}
            </p>
          </div>

          <!-- Elegant divider -->
          <div class="flex items-center justify-center gap-4 mb-6">
            <div class="w-12 h-px bg-gradient-to-r from-transparent to-sage/30"></div>
            <svg
              class="w-4 h-4 text-sage/50"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
            <div class="w-12 h-px bg-gradient-to-l from-transparent to-sage/30"></div>
          </div>

          <!-- Message -->
          <div class="text-center space-y-3">
            <p class="font-body text-charcoal leading-relaxed">
              {{ errorContent.message }}
            </p>
            <p class="font-body text-sm text-charcoal-light leading-relaxed">
              {{ errorContent.messageMs }}
            </p>
          </div>

          <!-- Bottom ornament -->
          <div class="flex justify-center mt-10">
            <svg
              class="w-16 h-8 text-sage/30"
              viewBox="0 0 64 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 16c8 0 12-8 20-8s12 8 20 8"
                stroke="currentColor"
                stroke-width="0.5"
                fill="none"
              />
              <path
                d="M24 16c8 0 12 8 20 8s12-8 20-8"
                stroke="currentColor"
                stroke-width="0.5"
                fill="none"
              />
              <circle cx="32" cy="16" r="2" fill="currentColor" />
            </svg>
          </div>
        </div>

        <!-- Bottom decorative border -->
        <div class="h-1 bg-gradient-to-r from-transparent via-sage to-transparent"></div>
      </div>
    </div>
  </main>
</template>

<style scoped>
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }
</style>
