<script setup lang="ts">
import { ref, onMounted } from "vue";
import QRCode from "qrcode";
import { weddingConfig } from "@/config/wedding";
import { useLanguage } from "@/composables/useLanguage";

const { t } = useLanguage();

const qrCodeDataUrl = ref<string>("");
const linkCopied = ref(false);
const websiteUrl = `https://harithzainudin.github.io/wedding/`;

const generateQrCode = async (): Promise<void> => {
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(websiteUrl, {
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

const downloadQrCode = (): void => {
  if (!qrCodeDataUrl.value) return;

  const link = document.createElement("a");
  link.download = `${weddingConfig.couple.bride.nickname}-${weddingConfig.couple.groom.nickname}-wedding-qr.png`;
  link.href = qrCodeDataUrl.value;
  link.click();
};

const shareQrCode = async (): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${weddingConfig.couple.bride.nickname} & ${weddingConfig.couple.groom.nickname}`,
        text: t.value.qrCode.subtitle,
        url: websiteUrl,
      });
    } catch {
      // User cancelled or share failed
    }
  } else {
    // Fallback: copy URL to clipboard
    await navigator.clipboard.writeText(websiteUrl);
    linkCopied.value = true;
    setTimeout(() => {
      linkCopied.value = false;
    }, 2000);
  }
};

onMounted(() => {
  generateQrCode();
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
      <div class="inline-block p-4 sm:p-6 bg-white dark:bg-white rounded-2xl shadow-lg mb-6">
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

      <!-- Couple Names under QR -->
      <p class="font-heading text-base sm:text-lg text-sage-dark dark:text-sage-light mb-6">
        {{ weddingConfig.couple.bride.nickname }} & {{ weddingConfig.couple.groom.nickname }}
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
</template>
