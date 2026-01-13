<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import QRCode from "qrcode";
import { useLanguage } from "@/composables/useLanguage";
import { usePublicWeddingData } from "@/composables/usePublicWeddingData";

const { t } = useLanguage();
const { getCoupleNames, getQrCodeUrl, isLoadingWeddingDetails } = usePublicWeddingData();

const couple = computed(() => getCoupleNames());
const websiteUrl = computed(() => getQrCodeUrl());

const qrCodeDataUrl = ref<string>("");
const largeQrCodeDataUrl = ref<string>("");
const linkCopied = ref(false);
const isModalOpen = ref(false);

const generateQrCode = async (): Promise<void> => {
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(websiteUrl.value, {
      width: 200,
      margin: 2,
      color: {
        dark: "#333333",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }
};

const generateLargeQrCode = async (): Promise<void> => {
  try {
    largeQrCodeDataUrl.value = await QRCode.toDataURL(websiteUrl.value, {
      width: 400,
      margin: 2,
      color: {
        dark: "#333333",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Failed to generate large QR code:", error);
  }
};

const openModal = async (): Promise<void> => {
  await generateLargeQrCode();
  isModalOpen.value = true;
  document.body.style.overflow = "hidden";
};

const closeModal = (): void => {
  isModalOpen.value = false;
  document.body.style.overflow = "";
};

const handleKeydown = (e: KeyboardEvent): void => {
  if (e.key === "Escape" && isModalOpen.value) {
    closeModal();
  }
};

const downloadQrCode = (): void => {
  if (!qrCodeDataUrl.value) return;

  const link = document.createElement("a");
  link.download = `${couple.value.bride.nickname}-${couple.value.groom.nickname}-wedding-qr.png`;
  link.href = qrCodeDataUrl.value;
  link.click();
};

const shareQrCode = async (): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${couple.value.bride.nickname} & ${couple.value.groom.nickname}`,
        text: t.value.qrCode.subtitle,
        url: websiteUrl.value,
      });
    } catch {
      // User cancelled or share failed
    }
  } else {
    // Fallback: copy URL to clipboard
    await navigator.clipboard.writeText(websiteUrl.value);
    linkCopied.value = true;
    setTimeout(() => {
      linkCopied.value = false;
    }, 2000);
  }
};

onMounted(() => {
  generateQrCode();
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <section class="py-12 sm:py-16 px-4 sm:px-6 bg-white dark:bg-dark-bg-secondary transition-colors duration-300">
    <div class="max-w-xl mx-auto text-center">
      <h2 class="font-heading text-xl sm:text-2xl md:text-3xl text-sage-dark dark:text-sage-light mb-2">
        {{ t.qrCode.title }}
      </h2>
      <p class="font-body text-sm sm:text-base text-charcoal-light dark:text-dark-text-secondary mb-6 sm:mb-8">
        {{ t.qrCode.subtitle }}
      </p>

      <!-- QR Code Display -->
      <div
        class="inline-block p-4 sm:p-6 bg-white dark:bg-white rounded-2xl shadow-lg mb-4 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        @click="openModal"
      >
        <img
          v-if="qrCodeDataUrl"
          :src="qrCodeDataUrl"
          alt="QR Code untuk jemputan perkahwinan"
          class="w-40 h-40 sm:w-48 sm:h-48 mx-auto"
        />
        <div
          v-else
          class="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-sand dark:bg-dark-bg-elevated rounded-lg"
        >
          <span class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">Loading...</span>
        </div>
      </div>

      <!-- Tap to enlarge hint -->
      <p class="font-body text-xs text-charcoal-light/70 dark:text-dark-text-secondary/70 mb-4">
        {{ t.qrCode.tapToEnlarge }}
      </p>

      <!-- Couple Names under QR -->
      <div v-if="isLoadingWeddingDetails" class="mb-6 flex justify-center">
        <div class="h-6 w-40 bg-sage/20 rounded animate-pulse"></div>
      </div>
      <p v-else class="font-heading text-base sm:text-lg text-sage-dark dark:text-sage-light mb-6">
        {{ couple.bride.nickname }} & {{ couple.groom.nickname }}
      </p>

      <!-- Action Buttons -->
      <div class="flex justify-center gap-3">
        <!-- Download Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 bg-sage text-white rounded-full font-body text-sm font-medium transition-colors hover:bg-sage-dark active:scale-95 cursor-pointer"
          @click="downloadQrCode"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span>{{ t.qrCode.download }}</span>
        </button>

        <!-- Share Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-dark-bg-elevated border border-sage text-sage rounded-full font-body text-sm font-medium transition-colors hover:bg-sage hover:text-white active:scale-95 cursor-pointer"
          @click="shareQrCode"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>{{ t.qrCode.share }}</span>
        </button>
      </div>

      <!-- Link Copied Message -->
      <p
        v-if="linkCopied"
        class="font-body text-sm text-sage mt-3"
      >
        {{ t.qrCode.linkCopied }}
      </p>
    </div>
  </section>

  <!-- QR Code Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/90" @click="closeModal"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full">
          <!-- Close Button -->
          <button
            type="button"
            class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            @click="closeModal"
          >
            <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <!-- Large QR Code -->
          <div class="flex flex-col items-center">
            <img
              v-if="largeQrCodeDataUrl"
              :src="largeQrCodeDataUrl"
              alt="QR Code untuk jemputan perkahwinan"
              class="w-64 h-64 sm:w-72 sm:h-72"
            />
            <div
              v-else
              class="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center bg-gray-100 rounded-lg"
            >
              <span class="font-body text-sm text-gray-500">Loading...</span>
            </div>

            <!-- Couple Names -->
            <p class="font-heading text-lg sm:text-xl text-sage-dark mt-4">
              {{ couple.bride.nickname }} & {{ couple.groom.nickname }}
            </p>

            <!-- Scan instruction -->
            <p class="font-body text-sm text-charcoal-light mt-2">
              {{ t.qrCode.subtitle }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
