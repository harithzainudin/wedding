import { ref, onMounted, onUnmounted } from "vue";

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  selector?: string;
}

export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const { threshold = 0.1, rootMargin = "0px 0px -50px 0px", selector = "[data-index]" } = options;

  const revealedItems = ref<Set<number>>(new Set());
  let observer: IntersectionObserver | null = null;

  const isRevealed = (index: number): boolean => {
    return revealedItems.value.has(index);
  };

  const observeElements = () => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      observer?.observe(el);
    });
  };

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute("data-index") || "0", 10);
            revealedItems.value = new Set([...revealedItems.value, index]);
            observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Use nextTick to ensure DOM is ready
    setTimeout(observeElements, 0);
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  return {
    revealedItems,
    isRevealed,
  };
}
