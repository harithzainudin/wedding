import { ref, computed } from "vue";
import { listRsvps, createRsvp, updateRsvp, deleteRsvp } from "@/services/api";
import type { RsvpSubmission, AdminRsvpRequest } from "@/types/rsvp";

export interface RsvpSummary {
  total: number;
  attending: number;
  notAttending: number;
  totalGuests: number;
}

export function useRsvps() {
  const rsvps = ref<RsvpSubmission[]>([]);
  const isLoading = ref(false);
  const loadError = ref("");
  const filter = ref<"all" | "attending" | "not_attending">("all");

  const summary = ref<RsvpSummary>({
    total: 0,
    attending: 0,
    notAttending: 0,
    totalGuests: 0,
  });

  // CRUD operation states
  const isCreating = ref(false);
  const isUpdating = ref(false);
  const isDeleting = ref(false);
  const operationError = ref("");

  const filteredRsvps = computed(() => {
    if (filter.value === "all") return rsvps.value;
    if (filter.value === "attending") return rsvps.value.filter((r) => r.isAttending);
    return rsvps.value.filter((r) => !r.isAttending);
  });

  const fetchRsvps = async (): Promise<void> => {
    isLoading.value = true;
    loadError.value = "";

    try {
      const data = await listRsvps();
      rsvps.value = data.rsvps;
      summary.value = data.summary;
    } catch {
      loadError.value = "Failed to load RSVPs. Please try again.";
    } finally {
      isLoading.value = false;
    }
  };

  const createRsvpEntry = async (data: AdminRsvpRequest): Promise<boolean> => {
    isCreating.value = true;
    operationError.value = "";

    try {
      await createRsvp(data);
      await fetchRsvps();
      return true;
    } catch (error) {
      operationError.value = error instanceof Error ? error.message : "Failed to create guest";
      return false;
    } finally {
      isCreating.value = false;
    }
  };

  const updateRsvpEntry = async (id: string, data: AdminRsvpRequest): Promise<boolean> => {
    isUpdating.value = true;
    operationError.value = "";

    try {
      await updateRsvp(id, data);
      await fetchRsvps();
      return true;
    } catch (error) {
      operationError.value = error instanceof Error ? error.message : "Failed to update guest";
      return false;
    } finally {
      isUpdating.value = false;
    }
  };

  const deleteRsvpEntry = async (id: string): Promise<boolean> => {
    isDeleting.value = true;
    operationError.value = "";

    try {
      await deleteRsvp(id);
      await fetchRsvps();
      return true;
    } catch (error) {
      operationError.value = error instanceof Error ? error.message : "Failed to delete guest";
      return false;
    } finally {
      isDeleting.value = false;
    }
  };

  const clearOperationError = (): void => {
    operationError.value = "";
  };

  const setFilter = (newFilter: "all" | "attending" | "not_attending"): void => {
    filter.value = newFilter;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const exportToCsv = (): void => {
    const headers = ["Title", "Full Name", "Phone", "Attending", "Guests", "Message", "Submitted At"];
    const rows = rsvps.value.map((r) => [
      r.title,
      r.fullName,
      r.phoneNumber,
      r.isAttending ? "Yes" : "No",
      r.numberOfGuests.toString(),
      `"${r.message.replace(/"/g, '""')}"`,
      r.submittedAt,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rsvp-list-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const clearRsvps = (): void => {
    rsvps.value = [];
  };

  return {
    rsvps,
    isLoading,
    loadError,
    filter,
    summary,
    filteredRsvps,
    fetchRsvps,
    setFilter,
    formatDate,
    exportToCsv,
    clearRsvps,
    // CRUD operations
    isCreating,
    isUpdating,
    isDeleting,
    operationError,
    createRsvpEntry,
    updateRsvpEntry,
    deleteRsvpEntry,
    clearOperationError,
  };
}
