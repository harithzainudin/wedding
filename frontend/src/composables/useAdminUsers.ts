import { ref } from "vue";
import {
  listAdminUsers,
  createAdminUser,
  deleteAdminUser,
  forceResetPassword,
} from "@/services/api";
import type { AdminUser } from "@/types/admin";

export interface CreateAdminResult {
  success: boolean;
  emailSent?: boolean | undefined;
  emailError?: string | undefined;
}

export interface ForceResetPasswordResult {
  success: boolean;
  temporaryPassword?: string | undefined;
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

  const resetPasswordConfirm = ref<string | null>(null);
  const isResetting = ref(false);
  const resetError = ref("");

  const fetchAdminUsers = async (): Promise<void> => {
    isLoadingAdmins.value = true;
    adminLoadError.value = "";

    try {
      const data = await listAdminUsers();
      adminUsers.value = data.admins;
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
      const request: {
        username: string;
        password: string;
        email?: string;
        createdBy: string;
      } = {
        username: newAdminUsername.value,
        password: newAdminPassword.value,
        createdBy: getCurrentUser(),
      };
      if (newAdminEmail.value) {
        request.email = newAdminEmail.value;
      }
      const data = await createAdminUser(request);
      newAdminUsername.value = "";
      newAdminPassword.value = "";
      newAdminEmail.value = "";
      showCreateForm.value = false;
      await fetchAdminUsers();

      return {
        success: true,
        emailSent: data.emailSent,
        emailError: data.emailError,
      };
    } catch (err) {
      createError.value =
        err instanceof Error
          ? err.message
          : "Failed to create admin user. Please try again.";
      return null;
    } finally {
      isCreating.value = false;
    }
  };

  const handleDeleteAdmin = async (adminUsername: string): Promise<boolean> => {
    isDeleting.value = true;

    try {
      await deleteAdminUser(adminUsername);
      deleteConfirm.value = null;
      await fetchAdminUsers();
      return true;
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete admin user. Please try again.",
      );
      return false;
    } finally {
      isDeleting.value = false;
    }
  };

  const handleForceResetPassword = async (
    adminUsername: string,
  ): Promise<ForceResetPasswordResult | null> => {
    resetError.value = "";
    isResetting.value = true;

    try {
      const data = await forceResetPassword(adminUsername);
      resetPasswordConfirm.value = null;
      return {
        success: true,
        temporaryPassword: data.temporaryPassword,
        emailSent: data.emailSent,
        emailError: data.emailError,
      };
    } catch (err) {
      resetError.value =
        err instanceof Error
          ? err.message
          : "Failed to reset password. Please try again.";
      return null;
    } finally {
      isResetting.value = false;
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
    resetPasswordConfirm,
    isResetting,
    resetError,
    fetchAdminUsers,
    handleCreateAdmin,
    handleDeleteAdmin,
    handleForceResetPassword,
    closeCreateForm,
    clearAdminUsers,
  };
}
