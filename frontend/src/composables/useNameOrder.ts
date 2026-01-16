import { computed } from "vue";
import { usePublicWeddingData } from "./usePublicWeddingData";
import type {
  CoupleInfo,
  ParentsInfo,
  DisplayNameOrder,
} from "@/types/weddingDetails";

export interface OrderedCouple {
  first: CoupleInfo;
  second: CoupleInfo;
  firstLabel: "bride" | "groom";
  secondLabel: "bride" | "groom";
}

export interface OrderedParents {
  first: ParentsInfo;
  second: ParentsInfo;
  firstLabel: "bride" | "groom";
  secondLabel: "bride" | "groom";
}

export interface OrderedParentsWithVisibility extends OrderedParents {
  firstVisible: boolean;
  secondVisible: boolean;
  showAny: boolean; // true if at least one is visible
  showBoth: boolean; // true if both are visible
}

/**
 * Centralized composable for handling bride/groom name ordering
 * based on Malay wedding customs (adat perkahwinan).
 *
 * Traditional order: Bride first (when wedding is at bride's side first)
 * Alternative: Groom first (when wedding is at groom's side first / bertandang)
 */
export function useNameOrder() {
  const {
    getCoupleNames,
    getParents,
    getDisplayNameOrder,
    getParentsVisibility,
  } = usePublicWeddingData();

  // Get the display order setting (defaults to bride_first)
  const displayOrder = computed<DisplayNameOrder>(() => getDisplayNameOrder());

  // Returns couple info in display order
  const orderedCouple = computed<OrderedCouple>(() => {
    const couple = getCoupleNames();
    const isBrideFirst = displayOrder.value === "bride_first";

    return {
      first: isBrideFirst ? couple.bride : couple.groom,
      second: isBrideFirst ? couple.groom : couple.bride,
      firstLabel: isBrideFirst ? "bride" : "groom",
      secondLabel: isBrideFirst ? "groom" : "bride",
    };
  });

  // Returns parents info in display order
  const orderedParents = computed<OrderedParents>(() => {
    const parents = getParents();
    const isBrideFirst = displayOrder.value === "bride_first";

    return {
      first: isBrideFirst ? parents.bride : parents.groom,
      second: isBrideFirst ? parents.groom : parents.bride,
      firstLabel: isBrideFirst ? "bride" : "groom",
      secondLabel: isBrideFirst ? "groom" : "bride",
    };
  });

  // Returns parents info in display order with visibility information
  const orderedParentsWithVisibility = computed<OrderedParentsWithVisibility>(
    () => {
      const parents = getParents();
      const visibility = getParentsVisibility();
      const isBrideFirst = displayOrder.value === "bride_first";

      const firstVisible = isBrideFirst
        ? visibility.showBrideParents
        : visibility.showGroomParents;
      const secondVisible = isBrideFirst
        ? visibility.showGroomParents
        : visibility.showBrideParents;

      return {
        first: isBrideFirst ? parents.bride : parents.groom,
        second: isBrideFirst ? parents.groom : parents.bride,
        firstLabel: isBrideFirst ? "bride" : "groom",
        secondLabel: isBrideFirst ? "groom" : "bride",
        firstVisible,
        secondVisible,
        showAny: firstVisible || secondVisible,
        showBoth: firstVisible && secondVisible,
      };
    },
  );

  // Returns formatted name string using nicknames (e.g., "Aisyah & Ahmad")
  const getOrderedNicknamesString = (separator = " & "): string => {
    const couple = orderedCouple.value;
    return `${couple.first.nickname}${separator}${couple.second.nickname}`;
  };

  // Returns formatted name string using full names
  const getOrderedFullNamesString = (separator = " & "): string => {
    const couple = orderedCouple.value;
    return `${couple.first.fullName}${separator}${couple.second.fullName}`;
  };

  // Helper to get raw couple data (unordered)
  const getRawCouple = () => getCoupleNames();

  // Helper to get raw parents data (unordered)
  const getRawParents = () => getParents();

  return {
    displayOrder,
    orderedCouple,
    orderedParents,
    orderedParentsWithVisibility,
    getOrderedNicknamesString,
    getOrderedFullNamesString,
    getRawCouple,
    getRawParents,
  };
}
