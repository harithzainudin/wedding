import { ref } from "vue";
import { listAdminUsers, createAdminUser, deleteAdminUser } from "@/services/api";
import type { AdminUser } from "@/types/admin";

export interface CreateAdminResult {
  success: boolean;
  emailSent?: boolean | undefined;
  emailError?: string | undefined;
}

export function useAdminUsers(getCurrentUser: () => string) {
  const adminUsers = ref<AdminUser[]>([]);
  const isLoadingAdmins = ref(false);
  const adminLoadError = ref("");

  const showCreateForm = ref(false);
  const newAdminUsername = ref("");
  const newAdminPassword = ref("");
  const newAdminEmail = ref("");
  const showNewAdminPassword = ref(false);
  const createError = ref("");
  const isCreating = ref(false);

  const deleteConfirm = ref<string | null>(null);
  const isDeleting = ref(false);

  const fetchAdminUsers = async (): Promise<void> => {
    isLoadingAdmins.value = true;
    adminLoadError.value = "";

    try {
      const response = await listAdminUsers();
      if (response.success && response.data) {
        adminUsers.value = response.data.admins;
      } else {
        adminLoadError.value = response.error ?? "Failed to load admin users";
      }
    } catch {
      adminLoadError.value = "Failed to load admin users. Please try again.";
    } finally {
      isLoadingAdmins.value = false;
    }
  };

  const handleCreateAdmin = async (): Promise<CreateAdminResult | null> => {
    createError.value = "";
    isCreating.value = true;

    try {
      const request: { username: string; password: string; email?: string; createdBy: string } = {
        username: newAdminUsername.value,
        password: newAdminPassword.value,
        createdBy: getCurrentUser(),
      };
      if (newAdminEmail.value) {
        request.email = newAdminEmail.value;
      }
      const response = await createAdminUser(request);
      if (response.success) {
        newAdminUsername.value = "";
        newAdminPassword.value = "";
        newAdminEmail.value = "";
        showCreateForm.value = false;
        await fetchAdminUsers();

        return {
          success: true,
          emailSent: response.emailSent,
          emailError: response.emailError,
        };
      } else {
        createError.value = response.error ?? "Failed to create admin user";
        return null;
      }
    } catch {
      createError.value = "Failed to create admin user. Please try again.";
      return null;
    } finally {
      isCreating.value = false;
    }
  };

  const handleDeleteAdmin = async (adminUsername: string): Promise<boolean> => {
    isDeleting.value = true;

    try {
      const response = await deleteAdminUser(adminUsername);
      if (response.success) {
        deleteConfirm.value = null;
        await fetchAdminUsers();
        return true;
      } else {
        alert(response.error ?? "Failed to delete admin user");
        return false;
      }
    } catch {
      alert("Failed to delete admin user. Please try again.");
      return false;
    } finally {
      isDeleting.value = false;
    }
  };

  const closeCreateForm = (): void => {
    showCreateForm.value = false;
    newAdminUsername.value = "";
    newAdminPassword.value = "";
    newAdminEmail.value = "";
    createError.value = "";
  };

  const clearAdminUsers = (): void => {
    adminUsers.value = [];
  };

  return {
    adminUsers,
    isLoadingAdmins,
    adminLoadError,
    showCreateForm,
    newAdminUsername,
    newAdminPassword,
    newAdminEmail,
    showNewAdminPassword,
    createError,
    isCreating,
    deleteConfirm,
    isDeleting,
    fetchAdminUsers,
    handleCreateAdmin,
    handleDeleteAdmin,
    closeCreateForm,
    clearAdminUsers,
  };
}
