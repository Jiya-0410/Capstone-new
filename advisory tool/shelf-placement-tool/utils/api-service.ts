// api-service.ts - Updated API Service with improved CORS handling

// The deployment URL for the Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbzQRd97bQ35X5nK2kGkMZiAnFnHoQBcGd3RaaJiDws6T7fiwhuD7kA9FV0YU7fvUXRk/exec";

// Set to true during development to bypass actual API calls
const DEVELOPMENT_MODE = true; // Set to true for testing, change to false for production

// Helper function to handle API errors with more detailed logging
const handleApiError = (error: any) => {
  console.error("API Error Details:", error);
  return {
    success: false,
    message: `Connection error: ${error.message || "Unknown error occurred"}. Please try again later.`
  };
};

// Helper function for making API requests
const makeApiRequest = async (action: string, data: any = {}) => {
  if (DEVELOPMENT_MODE) {
    console.log(`Development mode: ${action} bypassed with mock data`);
    return getMockResponse(action, data);
  }

  try {
    console.log(`Sending ${action} request with data:`, data);
    
    // Add the action to the data
    const requestData = { ...data, action };
    
    // For GET requests
    if (action === "checkApiStatus") {
      const response = await fetch(`${API_URL}?action=${action}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      const result = await response.json();
      console.log(`Received ${action} response:`, result);
      return result;
    }
    
    // For POST requests
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });
    
    const result = await response.json();
    console.log(`Received ${action} response:`, result);
    return result;
  } catch (error) {
    return handleApiError(error);
  }
};

// Generate mock responses for development mode
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
      
    default:
      return { success: false, message: "Unknown action in development mode" };
  }
};

// API Service object with methods for different API calls
const ApiService = {
  // Test the API connection
  checkApiStatus: async () => {
    return await makeApiRequest("checkApiStatus");
  },

  // User authentication
  userSignup: async (name: string, email: string, password: string) => {
    return await makeApiRequest("userSignup", { name, email, password });
  },

  userLogin: async (email: string, password: string) => {
    return await makeApiRequest("userLogin", { email, password });
  },

  verifyEmail: async (token: string) => {
    return await makeApiRequest("verifyEmail", { token });
  },

  resendVerificationCode: async (email: string) => {
    return await makeApiRequest("resendVerificationCode", { email });
  },

  userForgotPassword: async (email: string) => {
    return await makeApiRequest("forgotPassword", { email, isAdmin: false });
  },

  userResetPassword: async (email: string, token: string, newPassword: string) => {
    return await makeApiRequest("resetPassword", { email, token, newPassword, isAdmin: false });
  },

  // Admin authentication
  adminSignup: async (name: string, email: string, password: string, adminCode: string) => {
    return await makeApiRequest("adminSignup", { name, email, password, adminCode });
  },

  adminLogin: async (email: string, password: string) => {
    return await makeApiRequest("adminLogin", { email, password });
  },

  adminForgotPassword: async (email: string) => {
    return await makeApiRequest("forgotPassword", { email, isAdmin: true });
  },

  adminResetPassword: async (email: string, token: string, newPassword: string) => {
    return await makeApiRequest("resetPassword", { email, token, newPassword, isAdmin: true });
  }
};

export default ApiService;