import { ref, onMounted, onUnmounted } from "vue";
import { adminLogin } from "@/services/api";
import {
  storeTokens,
  clearTokens,
  hasValidTokens,
  getStoredUsername,
  getStoredIsMaster,
  refreshTokens,
  AUTH_EXPIRED_EVENT,
} from "@/services/tokenManager";

export function useAdminAuth() {
  const isAuthenticated = ref(false);
  const username = ref("");
  const password = ref("");
  const showLoginPassword = ref(false);
  const loginError = ref("");
  const isLoggingIn = ref(false);
  const currentUser = ref("");
  const isMasterUser = ref(false);

  const checkExistingAuth = async (): Promise<boolean> => {
    if (hasValidTokens()) {
      // Try to refresh to validate tokens are still valid
      const success = await refreshTokens();
      if (success) {
        isAuthenticated.value = true;
        currentUser.value = getStoredUsername() ?? "";
        isMasterUser.value = getStoredIsMaster();
        return true;
      }
    }

    // Clear invalid tokens
    clearTokens();
    return false;
  };

  const handleLogin = async (): Promise<boolean> => {
    loginError.value = "";
    isLoggingIn.value = true;

    try {
      const response = await adminLogin({ username: username.value, password: password.value });

      // Support both new (accessToken/refreshToken) and legacy (token) responses
      const accessToken = response.accessToken ?? response.token;
      const refreshToken = response.refreshToken;

      if (response.success && accessToken && refreshToken) {
        storeTokens({
          accessToken,
          refreshToken,
          expiresIn: response.expiresIn ?? 900,
          username: response.username ?? "",
          isMaster: response.isMaster ?? false,
        });

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
    clearTokens();
    isAuthenticated.value = false;
    currentUser.value = "";
    isMasterUser.value = false;
  };

  // Listen for auth expiry events from API calls
  const handleAuthExpired = (): void => {
    handleLogout();
  };

  onMounted(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  });

  onUnmounted(() => {
    window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  });

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
