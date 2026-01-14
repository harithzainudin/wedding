import { ref } from "vue";
import { changeAdminPassword } from "@/services/api";

export function usePasswordChange(getCurrentUser: () => string) {
  const showPasswordChangeModal = ref(false);
  const currentPasswordInput = ref("");
  const newPasswordInput = ref("");
  const confirmNewPasswordInput = ref("");
  const showCurrentPassword = ref(false);
  const showNewPassword = ref(false);
  const showConfirmNewPassword = ref(false);
  const passwordChangeError = ref("");
  const passwordChangeSuccess = ref(false);
  const isChangingPassword = ref(false);

  const handleChangePassword = async (): Promise<boolean> => {
    passwordChangeError.value = "";

    if (!currentPasswordInput.value || !newPasswordInput.value || !confirmNewPasswordInput.value) {
      passwordChangeError.value = "All fields are required";
      return false;
    }

    if (newPasswordInput.value.length < 6) {
      passwordChangeError.value = "New password must be at least 6 characters";
      return false;
    }

    if (newPasswordInput.value !== confirmNewPasswordInput.value) {
      passwordChangeError.value = "New passwords do not match";
      return false;
    }

    if (currentPasswordInput.value === newPasswordInput.value) {
      passwordChangeError.value = "New password must be different from current password";
      return false;
    }

    isChangingPassword.value = true;

    try {
      await changeAdminPassword({
        username: getCurrentUser(),
        currentPassword: currentPasswordInput.value,
        newPassword: newPasswordInput.value,
      });

      passwordChangeSuccess.value = true;
      currentPasswordInput.value = "";
      newPasswordInput.value = "";
      confirmNewPasswordInput.value = "";
      setTimeout(() => {
        showPasswordChangeModal.value = false;
        passwordChangeSuccess.value = false;
      }, 2000);
      return true;
    } catch (err) {
      passwordChangeError.value = err instanceof Error ? err.message : "Failed to change password. Please try again.";
      return false;
    } finally {
      isChangingPassword.value = false;
    }
  };

  const openPasswordChangeModal = (): void => {
    showPasswordChangeModal.value = true;
  };

  const closePasswordChangeModal = (): void => {
    showPasswordChangeModal.value = false;
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmNewPasswordInput.value = "";
    passwordChangeError.value = "";
    passwordChangeSuccess.value = false;
  };

  return {
    showPasswordChangeModal,
    currentPasswordInput,
    newPasswordInput,
    confirmNewPasswordInput,
    showCurrentPassword,
    showNewPassword,
    showConfirmNewPassword,
    passwordChangeError,
    passwordChangeSuccess,
    isChangingPassword,
    handleChangePassword,
    openPasswordChangeModal,
    closePasswordChangeModal,
  };
}
