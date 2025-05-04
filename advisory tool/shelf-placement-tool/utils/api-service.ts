const API_URL = "https://script.google.com/macros/s/AKfycbxwfIkv78V98UL6JJHXYFl27nzgrEZUiXX5EaIEYy3FIwWaeLrE54iyvBCZDpC3GlHs/exec";

const handleApiError = (error: any) => {
  console.error("API Error Details:", error);
  return {
    success: false,
    message: `Connection error: ${error.message || "Unknown error occurred"}. Please try again later.`
  };
};

const makeApiRequest = async (action: string, data: any = {}) => {
  try {
    const requestData = { ...data, action };
    console.log(`Making API request with action: ${action}`);

    // For GET requests
    if (["checkApiStatus", "getProducts", "getGrid", "getUsers", "getStoreInsights"].includes(action)) {
      const queryParams = new URLSearchParams({ action }).toString();
      const response = await fetch(`${API_URL}?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      const result = await response.json();
      console.log(`Received ${action} response:`, result);
      return result;
    }

    // For POST requests
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

// API service for Google Sheets integration
const ApiService = {
  // API Status
  checkApiStatus: async () => await makeApiRequest("checkApiStatus"),

  // Data Retrieval - Match actions directly to those in Google Apps Script
  getProducts: async () => await makeApiRequest("getProducts"),
  getGrid: async () => await makeApiRequest("getGrid"),
  getUsers: async () => await makeApiRequest("getUsers"),
  getStoreInsights: async () => await makeApiRequest("getStoreInsights"),

  // User Authentication
  userSignup: async (name: string, email: string, password: string) =>
    await makeApiRequest("userSignup", { name, email, password }),

  userLogin: async (email: string, password: string) =>
    await makeApiRequest("userLogin", { email, password }),

  verifyEmail: async (token: string) =>
    await makeApiRequest("verifyEmail", { token }),

  resendVerificationCode: async (email: string) =>
    await makeApiRequest("resendVerificationCode", { email }),

  forgotPassword: async (email: string) =>
    await makeApiRequest("forgotPassword", { email }),

  resetPassword: async (email: string, token: string, newPassword: string) =>
    await makeApiRequest("resetPassword", { email, token, newPassword }),

  getUserShelves: async (userEmail: string) =>
    await makeApiRequest("getUserShelves", { userEmail }),

  // Admin Authentication
  adminSignup: async (name: string, email: string, password: string, adminCode: string) =>
    await makeApiRequest("adminSignup", { name, email, password, adminCode }),

  adminLogin: async (email: string, password: string) =>
    await makeApiRequest("adminLogin", { email, password }),

  // Product Management
  saveProduct: async (productData: any) => 
    await makeApiRequest("saveProduct", productData),

  // Shelf Management
  addShelf: async (shelfData: any) => 
    await makeApiRequest("addShelf", shelfData),

  updateShelf: async (gridId: string, shelfData: any) => 
    await makeApiRequest("updateShelf", { gridId, shelfData }),

  deleteShelf: async (gridId: string) => 
    await makeApiRequest("deleteShelf", { gridId }),

  // Shelf Item Management
  addShelfItem: async (shelfItemData: any) => 
    await makeApiRequest("addShelfItem", shelfItemData),

  updateShelfItem: async (gridId: string, shelfItemData: any) => 
    await makeApiRequest("updateShelfItem", { gridId, shelfItemData }),

  deleteShelfItem: async (gridId: string) => 
    await makeApiRequest("deleteShelfItem", { gridId })
};

export default ApiService;