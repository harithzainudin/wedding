import { ref } from "vue";
import { adminLogin } from "@/services/api";

export function useAdminAuth() {
  const isAuthenticated = ref(false);
  const username = ref("");
  const password = ref("");
  const showLoginPassword = ref(false);
  const loginError = ref("");
  const isLoggingIn = ref(false);
  const currentUser = ref("");
  const isMasterUser = ref(false);

  const checkExistingAuth = (): boolean => {
    const token = sessionStorage.getItem("admin_token");
    const storedUsername = sessionStorage.getItem("admin_username");
    const storedIsMaster = sessionStorage.getItem("admin_is_master");
    if (token) {
      isAuthenticated.value = true;
      currentUser.value = storedUsername ?? "";
      isMasterUser.value = storedIsMaster === "true";
      return true;
    }
    return false;
  };

  const handleLogin = async (): Promise<boolean> => {
    loginError.value = "";
    isLoggingIn.value = true;

    try {
      const response = await adminLogin({ username: username.value, password: password.value });
      if (response.success && response.token) {
        sessionStorage.setItem("admin_token", response.token);
        sessionStorage.setItem("admin_username", response.username ?? "");
        sessionStorage.setItem("admin_is_master", response.isMaster ? "true" : "false");
        isAuthenticated.value = true;
        currentUser.value = response.username ?? "";
        isMasterUser.value = response.isMaster ?? false;
        username.value = "";
        password.value = "";
        return true;
      } else {
        loginError.value = response.error ?? "Invalid username or password";
        return false;
      }
    } catch {
      loginError.value = "Failed to login. Please try again.";
      return false;
    } finally {
      isLoggingIn.value = false;
    }
  };

  const handleLogout = (): void => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_username");
    sessionStorage.removeItem("admin_is_master");
    isAuthenticated.value = false;
    currentUser.value = "";
    isMasterUser.value = false;
  };

  return {
    isAuthenticated,
    username,
    password,
    showLoginPassword,
    loginError,
    isLoggingIn,
    currentUser,
    isMasterUser,
    checkExistingAuth,
    handleLogin,
    handleLogout,
  };
}
