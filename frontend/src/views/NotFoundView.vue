<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <main class="min-h-screen bg-sand flex items-center justify-center p-6">
    <div class="text-center">
      <h1 class="font-heading text-6xl text-sage-dark mb-4">404</h1>
      <p class="font-body text-xl text-charcoal mb-2">Halaman Tidak Dijumpai</p>
      <p class="font-body text-charcoal-light mb-8">
        Maaf, halaman yang anda cari tidak wujud.
      </p>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-lg font-body font-medium hover:bg-sage-dark transition-colors"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Kembali ke Laman Utama
      </RouterLink>
    </div>
  </main>
</template>
