// api-service.ts

// ✅ Deployment URL of your Google Apps Script endpoint
const API_URL = "https://script.google.com/macros/s/AKfycbyOQraXDIXxTtPdZsSqw5zH50zh0-oAdOhgIakAK9HznoHsIqxMffA-nU88CYcfC1US/exec";

// ✅ Toggle this for mocking instead of real API
const DEVELOPMENT_MODE = false;

// ✅ Central error handler
const handleApiError = (error: any) => {
  console.error("API Error Details:", error);
  return {
    success: false,
    message: `Connection error: ${error.message || "Unknown error occurred"}. Please try again later.`
  };
};

// ✅ API request handler
const makeApiRequest = async (action: string, data: any = {}) => {
  if (DEVELOPMENT_MODE) {
    console.log(`Development mode: ${action} mock response`);
    return getMockResponse(action, data);
  }

  try {
    const requestData = { ...data, action };

    if (action === "checkApiStatus") {
      const response = await fetch(`${API_URL}?action=${action}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      const result = await response.json();
      console.log(`Received ${action} response:`, result);
      return result;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    console.log(`Received ${action} response:`, result);
    return result;

  } catch (error) {
    return handleApiError(error);
  }
};

// ✅ Development mock data
const getMockResponse = (action: string, data: any) => {
  switch (action) {
    case "checkApiStatus":
      return { success: true, message: "API is running", version: "1.0.1" };

    case "userSignup":
      return {
        success: true,
        message: "Account created successfully. Please check your email to verify your account.",
        user: {
          id: "mock-user-id",
          name: data.name,
          email: data.email,
          isVerified: false
        },
        token: "mock-verification-token"
      };

    case "userLogin":
      return {
        success: true,
        message: "Login successful",
        user: {
          id: "mock-user-id",
          name: "Mock User",
          email: data.email,
          isVerified: true
        }
      };

    case "verifyEmail":
      return {
        success: true,
        message: "Email verified successfully. You can now log in.",
        user: {
          id: "mock-user-id",
          name: "Mock User",
          email: "user@example.com",
          isVerified: true
        }
      };

    case "resendVerificationCode":
      return {
        success: true,
        message: "A new verification code has been sent to your email.",
        token: "mock-verification-token"
      };

    case "forgotPassword":
      return {
        success: true,
        message: "Password reset instructions sent to your email",
        token: "mock-reset-token"
      };

    case "resetPassword":
      return {
        success: true,
        message: "Password reset successfully. You can now log in with your new password."
      };

    case "adminSignup":
      return {
        success: true,
        message: "Admin account created successfully. You can now log in.",
        admin: {
          id: "mock-admin-id",
          name: data.name,
          email: data.email
        }
      };

    case "adminLogin":
      return {
        success: true,
        message: "Admin login successful",
        admin: {
          id: "mock-admin-id",
          name: "Admin User",
          email: data.email
        }
      };

    default:
      return { success: false, message: "Unknown action in development mode" };
  }
};

// ✅ Exportable API service
const ApiService = {
  checkApiStatus: async () => await makeApiRequest("checkApiStatus"),

  // User
  userSignup: async (name: string, email: string, password: string) =>
    await makeApiRequest("userSignup", { name, email, password }),

  userLogin: async (email: string, password: string) =>
    await makeApiRequest("userLogin", { email, password }),

  verifyEmail: async (token: string) =>
    await makeApiRequest("verifyEmail", { token }),

  resendVerificationCode: async (email: string) =>
    await makeApiRequest("resendVerificationCode", { email }),

  userForgotPassword: async (email: string) =>
    await makeApiRequest("forgotPassword", { email, isAdmin: false }),

  userResetPassword: async (email: string, token: string, newPassword: string) =>
    await makeApiRequest("resetPassword", { email, token, newPassword, isAdmin: false }),

  // Admin
  adminSignup: async (name: string, email: string, password: string, adminCode: string) =>
    await makeApiRequest("adminSignup", { name, email, password, adminCode }),

  adminLogin: async (email: string, password: string) =>
    await makeApiRequest("adminLogin", { email, password }),

  adminForgotPassword: async (email: string) =>
    await makeApiRequest("forgotPassword", { email, isAdmin: true }),

  adminResetPassword: async (email: string, token: string, newPassword: string) =>
    await makeApiRequest("resetPassword", { email, token, newPassword, isAdmin: true })
};

export default ApiService;
