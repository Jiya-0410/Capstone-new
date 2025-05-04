import { useState, useEffect, SetStateAction } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import ApiService from "../utils/api-service";

interface Admin {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  storeId: string;
  status: string;
  registeredDate: string;
}

interface Product {
  id?: string;
  name: string;
  category: string;
  price: number;
  margin: number;
  size: string;
  demand: string;
  buyingDecision?: string;
  position?: string;
}

interface Store {
  id: string;
  name: string;
  status: string;
  salesVolume: number;
  profitConversion: number;
  customerTraffic: number;
}

interface ShelfGridItem {
  gridId: string;
  shelfPosition: string;
  productId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  location?: string;
  placedDate: string;
}

interface PlacementData {
  position: string;
  products: {
    productId: string;
    productName: string;
    userName: string;
    userId: string;
    placedDate: string;
  }[];
}

interface UserShelf {
  userId: string;
  userName: string;
  email?: string;
  placements: PlacementData[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [shelfGrid, setShelfGrid] = useState<ShelfGridItem[]>([]);
  const [placementData, setPlacementData] = useState<PlacementData[]>([]);
  const [userShelves, setUserShelves] = useState<UserShelf[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  
  // Filter states
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productDemandFilter, setProductDemandFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  
  // API status tracking
  const [apiStatuses, setApiStatuses] = useState({
    products: false,
    shelfGrid: false,
    users: false
  });

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem("admin");
    if (!adminData) {
      console.log("No admin data found, redirecting to login");
      router.push("/admin-login");
      return;
    }

    try {
      const parsedAdmin = JSON.parse(adminData);
      console.log("Admin authenticated:", parsedAdmin);
      setAdmin(parsedAdmin);
      
      // Fetch all necessary data
      fetchAllData();
    } catch (error) {
      console.error("Error parsing admin data:", error);
      localStorage.removeItem("admin");
      router.push("/admin-login");
    }
  }, [router]);
  
  // Process data when loaded
  useEffect(() => {
    if (shelfGrid.length > 0 && products.length > 0) {
      console.log("Processing placement data with:", 
        `${shelfGrid.length} shelf items,`,
        `${products.length} products`,
        `${users.length} users`
      );
      processPlacementData();
      processUserShelves();
      setLoading(false);
    }
  }, [shelfGrid, products, users, selectedStore]);

// Main function to fetch all data
const fetchAllData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    console.log("Fetching all data...");
    
    // First fetch the shelf grid data
    const shelfGridSuccess = await fetchShelfGrid();
    
    if (!shelfGridSuccess) {
      setError("Failed to fetch shelf grid data. The dashboard may not display correctly.");
      setLoading(false);
      return;
    }
    
    // Extract products directly from the API data
    const productsSuccess = await extractProductsFromGrid();
    
    // Derive users from the shelf grid
    const usersSuccess = await deriveUsersFromGrid();
    
    // Update API statuses
    setApiStatuses({
      products: productsSuccess,
      shelfGrid: shelfGridSuccess,
      users: usersSuccess
    });
    
    // Process the data into visualization format
    processPlacementData();
    processUserShelves();
    
    setLoading(false);
  } catch (error) {
    console.error("Error fetching all data:", error);
    setError("Failed to load required data. Please try refreshing the page.");
    setLoading(false);
  }
};
  
  // Fetch shelf grid data
  const fetchShelfGrid = async () => {
    try {
      console.log("Fetching shelf grid...");
      const response = await ApiService.getGrid();
      
      if (response && response.success) {
        console.log("Shelf grid fetched successfully", response.data);
        
        // Store the raw data for later use
        const rawData = response.data || [];
        
        if (Array.isArray(rawData) && rawData.length > 1) {
          // The first row contains headers
          const headers = rawData[0];
          
          // Get column indices
          const shelfIdIndex = headers.indexOf("shelfId");
          const userEmailIndex = headers.indexOf("userEmail");
          const userNameIndex = headers.indexOf("userName");
          const locationIndex = headers.indexOf("location");
          const createdAtIndex = headers.indexOf("createdAt");
          const productsJsonIndex = headers.indexOf("productsJson");
          
          console.log("Column indices:", {
            shelfId: shelfIdIndex,
            userEmail: userEmailIndex,
            userName: userNameIndex,
            location: locationIndex,
            createdAt: createdAtIndex,
            productsJson: productsJsonIndex
          });
          
          // Skip header row, process each data row
          const formattedShelfGrid: SetStateAction<ShelfGridItem[]> | {
            gridId: string; shelfPosition: any; productId: any; userId: any; // Use email as user ID
            userEmail: any; userName: any; location: any; placedDate: any;
          }[] = [];
          
          for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
            const row = rawData[rowIndex];
            
            if (!row[productsJsonIndex]) continue;
            
            try {
              // Parse the JSON data for products
              let products = [];
              try {
                products = JSON.parse(row[productsJsonIndex]);
                // Make sure products is an array
                if (!Array.isArray(products)) {
                  products = [products];
                }
              } catch (jsonError) {
                console.warn("Error parsing products JSON:", row[productsJsonIndex]);
                continue;
              }
              
              // For each product in the JSON array, create a shelf grid item
              products.forEach(product => {
                if (!product || !product.position) return;
                
                formattedShelfGrid.push({
                  gridId: `${row[shelfIdIndex] || `grid_${rowIndex}`}_${product.id || "unknown"}`,
                  shelfPosition: product.position,
                  productId: product.id,
                  userId: row[userEmailIndex], // Use email as user ID
                  userEmail: row[userEmailIndex],
                  userName: row[userNameIndex],
                  location: row[locationIndex],
                  placedDate: row[createdAtIndex] || new Date().toISOString().split('T')[0]
                });
              });
            } catch (error) {
              console.error("Error processing grid row:", error, row);
            }
          }
          
          console.log("Processed shelf grid:", formattedShelfGrid);
          setShelfGrid(formattedShelfGrid);
          return true;
        } else {
          console.warn("Shelf grid data is not in expected format:", rawData);
          setError("Shelf grid data is not in expected format. Check your Google Sheet.");
          setShelfGrid([]);
          return false;
        }
      } else {
        console.error("Failed to fetch shelf grid:", response ? response.message : "No response");
        setError(`Failed to fetch shelf grid: ${response ? response.message : "No response"}. Check your Google Apps Script.`);
        setShelfGrid([]);
        return false;
      }
    } catch (error) {
      console.error("Error fetching shelf grid:", error);
      setError("Failed to fetch shelf grid. Please try again later.");
      setShelfGrid([]);
      return false;
    }
  };
  
// Extract products from grid data
const extractProductsFromGrid = async () => {
  try {
    console.log("Extracting products from shelf grid data");
    
    // Get fresh data from the API to ensure we have the complete JSON
    const response = await ApiService.getGrid();
    if (!response || !response.success) {
      console.error("Failed to fetch data for product extraction");
      return false;
    }
    
    const rawData = response.data || [];
    if (!Array.isArray(rawData) || rawData.length <= 1) {
      console.error("Invalid data format for product extraction");
      return false;
    }
    
    // Find the productsJson column index
    const headers = rawData[0];
    const productsJsonIndex = headers.indexOf("productsJson");
    
    if (productsJsonIndex === -1) {
      console.error("productsJson column not found in data");
      return false;
    }
    
    // Extract all unique products
    const productMap = {};
    
    // Process each row (skip header)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row[productsJsonIndex]) continue;
      
      try {
        // Parse the JSON
        let productsJson = row[productsJsonIndex];
        if (typeof productsJson === 'string') {
          const products = JSON.parse(productsJson);
          // Handle both single product and array of products
          const productArray = Array.isArray(products) ? products : [products];
          
          // Add each product to our map
          productArray.forEach(product => {
            if (product && product.id && !productMap[product.id]) {
              productMap[product.id] = {
                id: product.id,
                name: product.name || "Unknown Product",
                category: product.category || "Uncategorized",
                price: parseFloat(product.price) || 0,
                margin: parseFloat(product.margin) || 0,
                size: product.size || "Standard",
                demand: product.demand || "medium",
                buyingDecision: product.buyingDecision || "",
                position: product.position || "",
                slot: product.slot || 0
              };
            }
          });
        }
      } catch (error) {
        console.warn(`Error parsing JSON in row ${i}:`, error);
      }
    }
    
    const productList = Object.values(productMap);
    console.log(`Extracted ${productList.length} products:`, productList);
    setProducts(productList);
    return productList.length > 0;
  } catch (error) {
    console.error("Error in extractProductsFromGrid:", error);
    return false;
  }
};
  
// Derive users from grid data
const deriveUsersFromGrid = async () => {
  try {
    // Get fresh data from the API to ensure we have the complete data
    const response = await ApiService.getGrid();
    if (!response || !response.success) {
      console.error("Failed to fetch data for user extraction");
      return false;
    }
    
    const rawData = response.data || [];
    if (!Array.isArray(rawData) || rawData.length <= 1) {
      console.error("Invalid data format for user extraction");
      return false;
    }
    
    // Find the column indices
    const headers = rawData[0];
    const userEmailIndex = headers.indexOf("userEmail");
    const userNameIndex = headers.indexOf("userName");
    const createdAtIndex = headers.indexOf("createdAt");
    
    if (userEmailIndex === -1) {
      console.error("userEmail column not found in data");
      return false;
    }
    
    // Get unique users from grid data
    const userMap = {};
    
    // Skip header row (index 0)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const email = row[userEmailIndex];
      const name = row[userNameIndex];
      const createdAt = row[createdAtIndex];
      
      if (email && !userMap[email]) {
        userMap[email] = {
          id: email, // Use email as ID for consistent matching
          name: name || email.split('@')[0],
          email: email,
          storeId: "s1", // Default store ID
          status: "verified", // Assume all users are verified
          registeredDate: createdAt || new Date().toISOString().split('T')[0]
        };
      }
    }
    
    const userList = Object.values(userMap);
    console.log("Derived users:", userList);
    setUsers(userList);
    return userList.length > 0;
  } catch (error) {
    console.error("Error deriving users:", error);
    return false;
  }
};
  
// Process placement data for combined shelf view
const processPlacementData = () => {
  console.log("Processing placement data with grid items:", shelfGrid.length);
  const placements = {};
  
  // Filter by store if needed
  let filteredShelfGrid = shelfGrid;
  
  // Group by position
  filteredShelfGrid.forEach(item => {
    // Skip items without positions
    if (!item.shelfPosition) return;
    
    // Find product for this item - use a fallback if not found
    const product = products.find(p => p.id === item.productId) || {
      id: item.productId,
      name: `Product ${item.productId}`
    };
    
    // Find user for this item
    const userName = item.userName || "Unknown User";
    
    // Initialize this position if needed
    if (!placements[item.shelfPosition]) {
      placements[item.shelfPosition] = {
        position: item.shelfPosition,
        products: []
      };
    }
    
    // Check if this exact product/user combo already exists
    const existingProduct = placements[item.shelfPosition].products.find(
      p => p.productId === item.productId && p.userName === userName
    );
    
    // Only add if it doesn't already exist
    if (!existingProduct) {
      placements[item.shelfPosition].products.push({
        productId: item.productId,
        productName: product.name,
        userName: userName,
        userId: item.userEmail || "unknown",
        placedDate: item.placedDate
      });
    }
  });
  
  // Convert to array and sort by position (A1, A2, B1, etc.)
  const placementsArray = Object.values(placements).sort((a, b) => {
    // Extract the letter part and number part for proper sorting
    const aMatch = a.position.match(/([A-Za-z]+)(\d+)/);
    const bMatch = b.position.match(/([A-Za-z]+)(\d+)/);
    
    if (aMatch && bMatch) {
      const [, aLetter, aNumber] = aMatch;
      const [, bLetter, bNumber] = bMatch;
      
      // Compare letters first
      if (aLetter !== bLetter) {
        return aLetter.localeCompare(bLetter);
      }
      
      // Then compare numbers
      return parseInt(aNumber) - parseInt(bNumber);
    }
    
    // Fallback to simple string comparison
    return a.position.localeCompare(b.position);
  });
  
  console.log("Processed placement data:", placementsArray);
  setPlacementData(placementsArray);
};
  
  // Process user-specific shelves
  const processUserShelves = () => {
    console.log("Processing user shelves");
    
    // Group all shelf items by user email
    const shelvesByUser = {};
    
    // Process each shelf grid item
    shelfGrid.forEach(item => {
      if (!item.userEmail) {
        console.warn("Item missing user email:", item);
        return;
      }
      
      const email = item.userEmail;
      
      // Get the user
      const user = users.find(u => u.id === email);
      if (!user && !shelvesByUser[email]) {
        // Create a placeholder user if not found
        console.warn(`User not found for email: ${email}, creating placeholder`);
      }
      
      // Initialize user shelf if needed
      if (!shelvesByUser[email]) {
        shelvesByUser[email] = {
          userId: email,
          userName: user?.name || item.userName || email.split('@')[0],
          email: email,
          placements: {}
        };
      }
      
      // Find product for this item
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        console.warn(`Product not found for ID: ${item.productId}`, item);
        return;
      }
      
      // Initialize position if needed
      const position = item.shelfPosition;
      if (!shelvesByUser[email].placements[position]) {
        shelvesByUser[email].placements[position] = {
          position: position,
          products: []
        };
      }
      
      // Check if this product already exists in this position
      const existingProduct = shelvesByUser[email].placements[position].products.find(
        p => p.productId === item.productId
      );
      
      // Only add if it doesn't already exist
      if (!existingProduct) {
        shelvesByUser[email].placements[position].products.push({
          productId: item.productId,
          productName: product.name,
          userName: shelvesByUser[email].userName,
          userId: email,
          placedDate: item.placedDate
        });
      }
    });
    
    // Convert placements from object to array for each user
    Object.values(shelvesByUser).forEach(userShelf => {
      userShelf.placements = Object.values(userShelf.placements).sort((a, b) => {
        // Sort positions alphanumerically (A1, A2, B1, etc.)
        const aMatch = a.position.match(/([A-Za-z]+)(\d+)/);
        const bMatch = b.position.match(/([A-Za-z]+)(\d+)/);
        
        if (aMatch && bMatch) {
          const [, aLetter, aNumber] = aMatch;
          const [, bLetter, bNumber] = bMatch;
          
          // Compare letters first
          if (aLetter !== bLetter) {
            return aLetter.localeCompare(bLetter);
          }
          
          // Then compare numbers
          return parseInt(aNumber) - parseInt(bNumber);
        }
        
        // Fallback to simple string comparison
        return a.position.localeCompare(b.position);
      });
    });
    
    // Convert to array and sort users alphabetically
    const processedShelves = Object.values(shelvesByUser)
      .filter(userShelf => userShelf.placements.length > 0)
      .sort((a, b) => a.userName.localeCompare(b.userName));
    
    console.log("Processed user shelves:", processedShelves);
    setUserShelves(processedShelves);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin");
    router.push("/admin-login");
  };
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesStatus = userStatusFilter === "all" || user.status === userStatusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearchTerm.toLowerCase());
    const matchesCategory = productCategoryFilter === "all" || product.category === productCategoryFilter;
    const matchesDemand = productDemandFilter === "all" || product.demand === productDemandFilter;
    
    return matchesSearch && matchesCategory && matchesDemand;
  });
  
  // Get unique categories for filter
  const productCategories = [...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
        
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: 'Poppins', sans-serif;
            color: #6b4f35;
            background: #f9f6f2;
          }
          .loading-spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-left-color: #8b6f47;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
      </Head>
      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="logo">
            <h2>Admin Panel</h2>
          </div>
          <nav className="nav-menu">
            <ul>
              <li className={activeTab === "dashboard" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("dashboard");}}>Dashboard</a>
              </li>
              <li className={activeTab === "product-placement" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("product-placement");}}>Product Placement</a>
              </li>
              <li className={activeTab === "user-shelves" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("user-shelves");}}>User Shelves</a>
              </li>
              <li className={activeTab === "users" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("users");}}>User Management</a>
              </li>
              <li className={activeTab === "products" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("products");}}>Products</a>
              </li>
              <li className={activeTab === "settings" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("settings");}}>Settings</a>
              </li>
            </ul>
          </nav>
          <div className="user-info">
            <div className="user-profile">
              <div className="user-avatar">
                {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="user-details">
                <h4>{admin?.name || 'Admin User'}</h4>
                <p>{admin?.email || 'admin@example.com'}</p>
                <span className="admin-badge">{admin?.role || 'Admin'}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-button">
              Log Out
            </button>
          </div>
        </aside>
        
        <main className="main-content">
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          
          {activeTab === "dashboard" && (
            <>
              <header className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <div className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </header>
              
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <div className="stat-value">{users.length}</div>
                  <p>Active users in system</p>
                </div>
                <div className="stat-card">
                  <h3>Total Products</h3>
                  <div className="stat-value">{products.length}</div>
                  <p>Products in inventory</p>
                </div>
                <div className="stat-card">
                  <h3>Active Stores</h3>
                  <div className="stat-value">{stores.filter(s => s.status === 'active').length}</div>
                  <p>Of {stores.length} total stores</p>
                </div>
                <div className="stat-card">
                  <h3>Product Placements</h3>
                  <div className="stat-value">{shelfGrid.length}</div>
                  <p>Total shelf placements</p>
                </div>
              </div>
              
              <div className="dashboard-panels">
                <div className="panel">
                  <h3>Recent Product Placements</h3>
                  {shelfGrid.length > 0 ? (
                    <>
                      <table className="user-table">
                        <thead>
                          <tr>
                            <th>Position</th>
                            <th>Product</th>
                            <th>Placed By</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shelfGrid
                            .sort((a, b) => new Date(b.placedDate).getTime() - new Date(a.placedDate).getTime())
                            .slice(0, 5)
                            .map((item, index) => {
                              const product = products.find(p => p.id === item.productId);
                              // Use the userName directly from the item
                              const userName = item.userName || 'Unknown User';
                              
                              return (
                                <tr key={index}>
                                  <td>{item.shelfPosition}</td>
                                  <td>{product?.name || 'Unknown Product'}</td>
                                  <td>{userName}</td>
                                  <td>{new Date(item.placedDate).toLocaleDateString()}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      <div className="panel-actions">
                        <button 
                          className="view-all-button" 
                          onClick={() => setActiveTab("product-placement")}
                        >
                          View All Placements
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="no-data-message">
                      <p>No product placement data available. Please check your API configuration in Settings.</p>
                      <button className="view-settings-button" onClick={() => setActiveTab("settings")}>
                        Go to Settings
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="panel">
                  <h3>Recent User Activity</h3>
                  {shelfGrid.length > 0 ? (
                    <>
                      <div className="activity-list">
                        {shelfGrid
                          .sort((a, b) => new Date(b.placedDate).getTime() - new Date(a.placedDate).getTime())
                          .slice(0, 5)
                          .map((item, index) => {
                            const product = products.find(p => p.id === item.productId);
                            // Use the userName directly from the item
                            const userName = item.userName || 'Unknown User';
                            
                            return (
                              <div className="activity-item" key={index}>
                                <div className="activity-icon product-placed"></div>
                                <div className="activity-content">
                                  <h4>Product Placement</h4>
                                  <p>{userName} placed {product?.name || 'Unknown Product'} at position {item.shelfPosition}</p>
                                  <span className="activity-time">
                                    {new Date(item.placedDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      <div className="panel-actions">
                        <button 
                          className="view-all-button"
                          onClick={() => setActiveTab("product-placement")}
                        >
                          View All Activity
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="no-data-message">
                      <p>No activity data available. Please check your API configuration in Settings.</p>
                    </div>
                  )}
                </div>
              </div>
              
              
              <div className="refresh-section">
                <button onClick={fetchAllData} className="refresh-button">
                  Refresh Dashboard Data
                </button>
                <p className="data-status">Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </>
          )}
          
          {activeTab === "product-placement" && (
            <>
              <header className="dashboard-header">
                <h1>Product Placement Visualization</h1>
                <div className="filter-controls">
                  <select 
                    className="filter-select"
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                  >
                    <option value="all">All Stores</option>
                    {stores.map((store, index) => (
                      <option key={index} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              </header>
              
              {shelfGrid.length === 0 ? (
                <div className="no-data-message">
                  <h3>No Shelf Data Available</h3>
                  <p>No shelf grid data found in your Google Sheet. Please check your Google Apps Script configuration.</p>
                  <p className="api-help-text">Your Google Apps Script should implement the <code>getGrid</code> action to handle shelf data requests.</p>
                  <button className="refresh-button" onClick={fetchShelfGrid}>Try Again</button>
                </div>
              ) : placementData.length === 0 ? (
                <div className="no-data-message">
                  <h3>No Placement Data</h3>
                  <p>No product placement data is available or matches your filter.</p>
                </div>
              ) : (
                <>
                  <div className="panel">
                    <h3>Shelf Grid Layout</h3>
                    <p className="shelf-instruction">
                      This grid shows product placements across all shelves. When multiple products are placed in the same position, they are shown stacked.
                    </p>
                    
                    <div className="shelf-grid">
                      {placementData.map((position, index) => (
                        <div className="shelf-position" key={index}>
                          <div className="position-label">{position.position}</div>
                          <div className="products-stack">
                            {position.products.map((product, pidx) => (
                              <div 
                                className="product-placement-item"
                                key={pidx}
                                style={{ marginTop: `${pidx * 5}px`, marginLeft: `${pidx * 5}px` }}
                              >
                                <div className="product-name">{product.productName}</div>
                                <div className="product-user">Placed by: {product.userName}</div>
                                <div className="product-date">{new Date(product.placedDate).toLocaleDateString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="panel">
                    <h3>Product Placement Data</h3>
                    <table className="placement-table">
                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Products</th>
                          <th>Placed By</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {placementData.map((position, index) => (
                          <tr key={index}>
                            <td>{position.position}</td>
                            <td>
                              <ul className="stacked-list">
                                {position.products.map((product, pidx) => (
                                  <li key={pidx}>{product.productName}</li>
                                ))}
                              </ul>
                            </td>
                            <td>
                              <ul className="stacked-list">
                                {position.products.map((product, pidx) => (
                                  <li key={pidx}>{product.userName}</li>
                                ))}
                              </ul>
                            </td>
                            <td>
                              <ul className="stacked-list">
                                {position.products.map((product, pidx) => (
                                  <li key={pidx}>{new Date(product.placedDate).toLocaleDateString()}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === "user-shelves" && (
            <>
              <header className="dashboard-header">
                <h1>User Shelves</h1>
                <div className="filter-controls">
                  <select 
                    className="filter-select"
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                  >
                    <option value="all">All Stores</option>
                    {stores.map((store, index) => (
                      <option key={index} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              </header>
              
              {shelfGrid.length === 0 ? (
                <div className="no-data-message">
                  <h3>No Shelf Data Available</h3>
                  <p>No shelf grid data found in your Google Sheet. Please check your Google Apps Script configuration.</p>
                  <button className="refresh-button" onClick={fetchShelfGrid}>Try Again</button>
                </div>
              ) : userShelves.length === 0 ? (
                <div className="no-data-message">
                  <h3>No User Shelf Data</h3>
                  <p>No user shelf data is available or matches your filter.</p>
                </div>
              ) : (
                <div className="user-shelves-container">
                  {userShelves.map((userShelf, index) => (
                    <div className="panel user-shelf-panel" key={index}>
                      <h3>{userShelf.userName}'s Shelf</h3>
                      
                      <div className="user-shelf-grid">
                        {userShelf.placements.map((position, posIndex) => (
                          <div className="shelf-position user-shelf" key={posIndex}>
                            <div className="position-label">{position.position}</div>
                            <div className="products-stack">
                              {position.products.map((product, pidx) => (
                                <div 
                                  className="product-placement-item"
                                  key={pidx}
                                  style={{ marginTop: `${pidx * 5}px`, marginLeft: `${pidx * 5}px` }}
                                >
                                  <div className="product-name">{product.productName}</div>
                                  <div className="product-date">{new Date(product.placedDate).toLocaleDateString()}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {placementData.length > 0 && (
                <div className="panel">
                  <h3>Combined Shelf View</h3>
                  <p className="shelf-instruction">
                    This shows all products placed by all users in a single combined view.
                  </p>
                  
                  <div className="shelf-grid combined-view">
                    {placementData.map((position, index) => (
                      <div className="shelf-position" key={index}>
                        <div className="position-label">{position.position}</div>
                        <div className="products-stack">
                          {position.products.map((product, pidx) => (
                            <div 
                              className="product-placement-item combined"
                              key={pidx}
                              style={{ marginTop: `${pidx * 5}px`, marginLeft: `${pidx * 5}px` }}
                            >
                              <div className="product-name">{product.productName}</div>
                              <div className="product-user">{product.userName}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "users" && (
            <>
              <header className="dashboard-header">
                <h1>User Management</h1>
                <div className="filter-controls">
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="search-input" 
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                  <select 
                    className="filter-select"
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </header>
              
              <div className="panel">
                {filteredUsers.length === 0 ? (
                  <div className="no-data-message">
                    <p>No users found matching your criteria.</p>
                  </div>
                ) : (
                  <table className="user-table full-width">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Store</th>
                        <th>Registered</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => {
                        const store = stores.find(s => s.id === user.storeId);
                        
                        return (
                          <tr key={index}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{store?.name || 'N/A'}</td>
                            <td>{new Date(user.registeredDate).toLocaleDateString()}</td>
                            <td>
                              <span className={`user-status ${user.status}`}>
                                {user.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
          {activeTab === "products" && (
            <>
              <header className="dashboard-header">
                <h1>Products Management</h1>
                <div className="filter-controls">
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    className="search-input"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                  {productCategories.length > 0 && (
                    <select 
                      className="filter-select"
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {productCategories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                  )}
                  <select 
                    className="filter-select"
                    value={productDemandFilter}
                    onChange={(e) => setProductDemandFilter(e.target.value)}
                  >
                    <option value="all">All Demand</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </header>
              
              <div className="panel">
                {filteredProducts.length === 0 ? (
                  <div className="no-data-message">
                    <p>No products found matching your criteria.</p>
                  </div>
                ) : (
                  <table className="product-table full-width">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Margin</th>
                        <th>Size</th>
                        <th>Demand</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product, index) => (
                        <tr key={index}>
                          <td>{product.name}</td>
                          <td>{product.category}</td>
                          <td>${product.price.toFixed(2)}</td>
                          <td>${product.margin.toFixed(2)}</td>
                          <td>{product.size}</td>
                          <td>
                            <span className={`${product.demand}-demand`}>
                              {product.demand.charAt(0).toUpperCase() + product.demand.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
          {activeTab === "stores" && (
            <>
              <header className="dashboard-header">
                <h1>Store Management</h1>
              </header>
              
              <div className="stores-grid">
                {stores.length === 0 ? (
                  <div className="no-data-message full-width">
                    <p>No store data available. Please check your API configuration in Settings.</p>
                  </div>
                ) : (
                  stores.map((store, index) => (
                    <div className="store-card" key={index}>
                      <div className="store-header">
                        <h3>{store.name}</h3>
                        <span className={`store-badge ${store.status}`}>{store.status}</span>
                      </div>
                      <div className="store-details">
                        <div className="store-info-row">
                          <span className="store-info-label">Sales Volume:</span>
                          <span className="store-info-value">${store.salesVolume.toLocaleString()}</span>
                        </div>
                        <div className="store-info-row">
                          <span className="store-info-label">Profit Conversion:</span>
                          <span className="store-info-value">{store.profitConversion}%</span>
                        </div>
                        <div className="store-info-row">
                          <span className="store-info-label">Customer Traffic:</span>
                          <span className="store-info-value">{store.customerTraffic.toLocaleString()}/day</span>
                        </div>
                      </div>
                      <div className="store-actions">
                        <button className="store-action-button">View Details</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <header className="dashboard-header">
                <h1>System Settings & API Configuration</h1>
              </header>
              
              <div className="panel api-panel">
                <h3>Google Apps Script API Configuration</h3>
                
                <div className="api-config-form">
                  <div className="config-group">
                    <label className="config-label">API Endpoint</label>
                    <input 
                      type="text" 
                      className="config-input" 
                      value="https://script.google.com/macros/s/AKfycbxwfIkv78V98UL6JJHXYFl27nzgrEZUiXX5EaIEYy3FIwWaeLrE54iyvBCZDpC3GlHs/exec" 
                      readOnly 
                    />
                    <p className="help-text">This is the Google Apps Script web app URL that provides data for the dashboard.</p>
                  </div>
                  
                  <div className="api-test-actions">
                    <button 
                      className="test-api-button"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const response = await ApiService.checkApiStatus();
                          setLoading(false);
                          if (response && response.success) {
                            alert(`API is running.\nVersion: ${response.version || '1.0'}\nTimestamp: ${response.timestamp || new Date().toISOString()}`);
                          } else {
                            alert(`API Error: ${response?.message || 'Unknown error'}`);
                          }
                        } catch (error) {
                          setLoading(false);
                          alert(`API Test Failed: ${error.message || 'Unknown error'}`);
                        }
                      }}
                    >
                      Test API Connection
                    </button>
                    <button 
                      className="refresh-button"
                      onClick={fetchAllData}
                    >
                      Refresh All Data
                    </button>
                  </div>
                </div>
                
                <div className="api-status-section">
                  <h4>API Endpoints Status</h4>
                  <div className="api-status-grid">
                    <div className="api-status-item">
                      <span className="status-label">Products API:</span>
                      <span className={`status-value ${apiStatuses.products ? 'status-good' : 'status-error'}`}>
                        {apiStatuses.products ? 'Working' : 'Not Working'}
                      </span>
                    </div>
                    <div className="api-status-item">
                      <span className="status-label">Shelf Grid API:</span>
                      <span className={`status-value ${apiStatuses.shelfGrid ? 'status-good' : 'status-error'}`}>
                        {apiStatuses.shelfGrid ? 'Working' : 'Not Working'}
                      </span>
                    </div>
                    <div className="api-status-item">
                      <span className="status-label">Users API:</span>
                      <span className={`status-value ${apiStatuses.users ? 'status-good' : 'status-error'}`}>
                        {apiStatuses.users ? 'Working' : 'Not Working'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="api-help-section">
                  <h4>Google Apps Script Implementation Guide</h4>
                  <p>
                    To properly configure your Google Apps Script for this dashboard, make sure it implements the following action handlers:
                  </p>
                  
                  <div className="api-requirements">
                    <div className="required-api">
                      <h5>Required API Endpoints</h5>
                      <ul className="action-list">
                        <li>
                          <code>getGrid</code> - Returns data from the "ShelfGrid" sheet
                          <span className={`status-indicator ${apiStatuses.shelfGrid ? 'working' : 'not-working'}`}>
                            {apiStatuses.shelfGrid ? 'Working' : 'Not Working'}
                          </span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="optional-api">
                      <h5>Optional API Endpoints</h5>
                      <ul className="action-list">
                        <li>
                          <code>getUsers</code> - Returns user data
                          <span className={`status-indicator ${apiStatuses.users ? 'working' : 'not-working'}`}>
                            {apiStatuses.users ? 'Working' : 'Not Working'}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  
                </div>
              </div>
              
              <div className="panel account-panel">
                <h3>Account Settings</h3>
                
                <div className="account-form">
                  <div className="form-group">
                    <label className="form-label">Admin Name</label>
                    <input type="text" className="form-input" defaultValue={admin?.name || 'Admin User'} />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" defaultValue={admin?.email || 'admin@example.com'} />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-input" defaultValue="••••••••" />
                    <button className="change-password-button">Change Password</button>
                  </div>
                  
                  <div className="form-actions">
                    <button className="save-button">Save Changes</button>
                  </div>
                </div>
              </div>
              
              <div className="panel data-management-panel">
                <h3>Data Management</h3>
                
                <div className="data-actions">
                  <div className="data-action-item">
                    <h4>Refresh Data</h4>
                    <p>Reload all data from the Google Sheets API</p>
                    <button className="refresh-button" onClick={fetchAllData}>Refresh All Data</button>
                  </div>
                  
                  <div className="data-action-item">
                    <h4>Test Individual Endpoints</h4>
                    <div className="endpoint-test-buttons">
                      <button className="test-endpoint-button" onClick={fetchShelfGrid}>
                        Test Shelf Grid API
                      </button>
                      <button className="test-endpoint-button" onClick={deriveUsersFromGrid}>
                        Derive Users from Grid
                      </button>
                      <button className="test-endpoint-button" onClick={extractProductsFromGrid}>
                        Extract Products from Grid
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
        <style jsx>{`
          /* Base Styles */
          .dashboard-container {
            display: flex;
            min-height: 100vh;
            font-family: 'Poppins', sans-serif;
          }
          
          /* Sidebar Styles */
          .sidebar {
            width: 280px;
            background: #7a5d3a;
            color: white;
            display: flex;
            flex-direction: column;
            padding: 20px;
          }
          
          .logo {
            padding: 10px 0 30px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .logo h2 {
            margin: 0;
            font-size: 1.8rem;
          }
          
          .nav-menu {
            margin-top: 30px;
            flex-grow: 1;
          }
          
          .nav-menu ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .nav-menu li {
            margin-bottom: 5px;
            border-radius: 8px;
            transition: background 0.3s;
          }
          
          .nav-menu li.active, .nav-menu li:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          
          .nav-menu a {
            color: white;
            text-decoration: none;
            display: block;
            padding: 12px 15px;
            font-size: 1.1rem;
          }
          
          .user-info {
            margin-top: auto;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .user-profile {
            display: flex;
            align-items: center;
            margin-bottom: 15px;}
          
          .user-avatar {
            width: 40px;
            height: 40px;
            background: #e0c9a7;
            color: #6b4f35;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 1.2rem;
            margin-right: 12px;
          }
          
          .user-details h4 {
            margin: 0 0 5px;
            font-size: 1rem;
          }
          
          .user-details p {
            margin: 0 0 5px;
            font-size: 0.85rem;
            opacity: 0.7;
          }
          
          .admin-badge {
            display: inline-block;
            background: #e0c9a7;
            color: #7a5d3a;
            font-size: 0.7rem;
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: bold;
          }
          
          .logout-button {
            width: 100%;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.3s;
          }
          
          .logout-button:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          
          /* Main Content Styles */
          .main-content {
            flex-grow: 1;
            background: #f9f6f2;
            padding: 30px;
            overflow: auto;
          }
          
          .error-message {
            background: rgba(244, 67, 54, 0.1);
            color: #d32f2f;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .error-message button {
            background: #d32f2f;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
          }
          
          .no-data-message {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            margin-bottom: 20px;
          }
          
          .no-data-message h3 {
            color: #6b4f35;
            margin-top: 0;
          }
          
          .no-data-message.full-width {
            grid-column: 1 / -1;
          }
          
          .api-help-text {
            background: #fff3e0;
            padding: 10px;
            border-radius: 4px;
            font-size: 0.9rem;
            margin: 10px 0;
          }
          
          .api-help-text code {
            background: #f0e0c0;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
          }
          
          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }
          
          .dashboard-header h1 {
            margin: 0;
            color: #6b4f35;
            font-size: 2rem;
          }
          
          .date {
            color: #6b4f35;
            opacity: 0.7;
            font-size: 1.1rem;
          }
          
          .dashboard-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          
          .stat-card h3 {
            margin: 0 0 15px;
            color: #6b4f35;
            font-size: 1.1rem;
            opacity: 0.7;
          }
          
          .stat-value {
            font-size: 2rem;
            color: #6b4f35;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .stat-card p {
            margin: 0;
            color: #388e3c;
            font-size: 0.9rem;
          }
          
          .dashboard-panels {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .panel {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            margin-bottom: 20px;
          }
          
          .panel h3 {
            margin: 0 0 20px;
            color: #6b4f35;
            font-size: 1.2rem;
          }
          
          .user-table, .product-table, .placement-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .user-table th, .user-table td, 
          .product-table th, .product-table td,
          .placement-table th, .placement-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          
          .user-table th, .product-table th, .placement-table th {
            color: #6b4f35;
            font-weight: bold;
            opacity: 0.7;
          }
          
          .user-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: bold;
          }
          
          .user-status.verified {
            color: #388e3c;
            background: rgba(56, 142, 60, 0.1);
          }
          
          .user-status.pending {
            color: #f57c00;
            background: rgba(245, 124, 0, 0.1);
          }
          
          .user-status.blocked {
            color: #d32f2f;
            background: rgba(211, 47, 47, 0.1);
          }
          
          .high-demand {
            color: #388e3c;
            background: rgba(56, 142, 60, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: bold;
          }
          
          .medium-demand {
            color: #f57c00;
            background: rgba(245, 124, 0, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: bold;
          }
          
          .low-demand {
            color: #e53935;
            background: rgba(229, 57, 53, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: bold;
          }
          
          .panel-actions {
            margin-top: 15px;
            text-align: center;
          }
          
          .view-all-button, .view-settings-button {
            background: transparent;
            color: #7a5d3a;
            border: 1px solid #7a5d3a;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
          }
          
          .view-all-button:hover, .view-settings-button:hover {
            background: #7a5d3a;
            color: white;
          }
          
          .activity-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .activity-item {
            display: flex;
            align-items: flex-start;
            padding-bottom: 15px;
            border-bottom: 1px solid #f0f0f0;
          }
          
          .activity-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #f0f0f0;
            margin-right: 15px;
            position: relative;
          }
          
          .activity-icon.product-placed {
            background: rgba(56, 142, 60, 0.1);
          }
          
          .activity-content h4 {
            margin: 0 0 5px;
            color: #6b4f35;
            font-size: 1rem;
          }
          
          .activity-content p {
            margin: 0 0 5px;
            color: #6b4f35;
            opacity: 0.7;
            font-size: 0.9rem;
          }
          
          .activity-time {
            font-size: 0.8rem;
            color: #888;
          }
          
          /* Store Cards */
          .stores-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
          }
          
          .stores-grid.mini-view {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          }
          
          .store-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
          }
          
          .store-card.mini {
            padding: 15px;
          }
          
          .store-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          
          .store-header h3 {
            margin: 0;
            color: #6b4f35;
          }
          
          .store-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
          }
          
          .store-badge.active {
            background: rgba(56, 142, 60, 0.1);
            color: #388e3c;
          }
          
          .store-badge.maintenance {
            background: rgba(255, 152, 0, 0.1);
            color: #f57c00;
          }
          
          .store-badge.inactive {
            background: rgba(211, 47, 47, 0.1);
            color: #d32f2f;
          }
          
          .store-details {
            margin-bottom: 20px;
          }
          
          .store-info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          
          .store-info-label {
            color: #6b4f35;
            opacity: 0.7;
          }
          
          .store-info-value {
            color: #6b4f35;
            font-weight: bold;
          }
          
          .store-actions {
            display: flex;
            gap: 10px;
            margin-top: auto;
          }
          
          .store-action-button {
            flex: 1;
            padding: 8px 0;
            background: transparent;
            color: #7a5d3a;
            border: 1px solid #7a5d3a;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
          }
          
          .store-action-button:hover {
            background: #7a5d3a;
            color: white;
          }
          
          /* User Management Tab Styles */
          .search-input {
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
            width: 250px;
            margin-right: 10px;
          }
          
          .filter-select {
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
            margin-right: 10px;
            background-color: white;
          }
          
          .filter-controls {
            display: flex;
            align-items: center;
          }
          
          .full-width {
            width: 100%;
          }
          
          /* Product Placement Visualization */
          .shelf-instruction {
            color: #6b4f35;
            margin-bottom: 20px;
            font-size: 0.9rem;
          }
          
          .shelf-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .shelf-position {
            background: #f5eee3;
            border-radius: 10px;
            padding: 15px;
            min-height: 150px;
            position: relative;
          }
          
          .position-label {
            position: absolute;
            top: 10px;
            left: 10px;
            background: #7a5d3a;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
          }
          
          .products-stack {
            margin-top: 30px;
            position: relative;
          }
          
          .product-placement-item {
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
            z-index: 1;
          }
          
          .product-name {
            font-weight: bold;
            color: #6b4f35;
            margin-bottom: 5px;
          }
          
          .product-user {
            font-size: 0.8rem;
            color: #7a5d3a;
            margin-bottom: 3px;
          }
          
          .product-date {
            font-size: 0.7rem;
            color: #999;
          }
          
          .stacked-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .stacked-list li {
            padding: 3px 0;
            border-bottom: 1px dashed #f0f0f0;
          }
          
          .stacked-list li:last-child {
            border-bottom: none;
          }
          
          /* User Shelves Styles */
          .user-shelves-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          
          .user-shelf-panel {
            background: white;
          }
          
          .user-shelf-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 15px;
          }
          
          /* API Settings Styles */
          .api-panel, .account-panel, .data-management-panel {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
          }
          
          .api-config-form, .account-form {
            margin-bottom: 20px;
          }
          
          .config-group, .form-group {
            margin-bottom: 15px;
          }
          
          .config-label, .form-label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #6b4f35;
          }
          
          .config-input, .form-input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
          }
          
          .help-text {
            font-size: 0.8rem;
            color: #666;
            margin-top: 5px;
          }
          
          .api-test-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
          }
          
          .test-api-button, .refresh-button, .save-button, .test-endpoint-button {
            background: #7a5d3a;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.3s;
          }
          
          .test-api-button:hover, .refresh-button:hover, .save-button:hover, .test-endpoint-button:hover {
            background: #6b4f35;
          }
          
          .api-status-section, .api-help-section {
            background: #f9f6f2;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
          }
          
          .api-status-section h4, .api-help-section h4 {
            margin-top: 0;
            color: #6b4f35;
          }
          
          .api-status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
          }
          
          .api-status-item {
            display: flex;
            justify-content: space-between;
            background: white;
            padding: 10px;
            border-radius: 4px;
            align-items: center;
          }
          
          .status-label {
            font-weight: bold;
            color: #6b4f35;
          }
          
          .status-good {
            color: #388e3c;
            font-weight: bold;
          }
          
          .status-error {
            color: #d32f2f;
            font-weight: bold;
          }
          
          .api-requirements {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 15px 0;
          }
          
          .required-api, .optional-api {
            background: white;
            padding: 15px;
            border-radius: 8px;
          }
          
          .required-api h5, .optional-api h5 {
            margin-top: 0;
            color: #6b4f35;
          }
          
          .action-list {
            list-style: none;
            padding: 0;
          }
          
          .action-list li {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            align-items: center;
          }
          
          .action-list code {
            background: #f0f0f0;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
          }
          
          .status-indicator {
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: bold;
          }
          
          .status-indicator.working {
            background: rgba(56, 142, 60, 0.1);
            color: #388e3c;
          }
          
          .status-indicator.not-working {
            background: rgba(211, 47, 47, 0.1);
            color: #d32f2f;
          }
          
          .doGet-example {
            margin-top: 20px;
          }
          
          .doGet-example h5 {
            margin-top: 0;
            color: #6b4f35;
          }
          
          .code-block {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.85rem;
            overflow-x: auto;
            white-space: pre-wrap;
            margin: 0;
          }
          
          .note {
            background: #ffe0b2;
            padding: 10px;
            border-radius: 4px;
            margin-top: 20px;
            font-size: 0.9rem;
          }
          
          .change-password-button {
            background: none;
            border: none;
            color: #7a5d3a;
            text-decoration: underline;
            cursor: pointer;
            padding: 0;
            margin-top: 5px;
          }
          
          .form-actions {
            margin-top: 20px;
          }
          
          .data-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          }
          
          .data-action-item {
            background: #f9f6f2;
            padding: 15px;
            border-radius: 8px;
          }
          
          .data-action-item h4 {
            margin-top: 0;
            color: #6b4f35;
          }
          
          .endpoint-test-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          
          .refresh-section {
            text-align: center;
            margin-top: 20px;
          }
          
          .data-status {
            font-size: 0.9rem;
            color: #6b4f35;
            margin-top: 8px;
          }
          
          /* Responsive Styles */
          @media (max-width: 1024px) {
            .dashboard-panels {
              grid-template-columns: 1fr;
            }
            
            .shelf-grid {
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            }
            
            .api-requirements {
              grid-template-columns: 1fr;
            }
            
            .data-actions {
              grid-template-columns: 1fr;
            }
          }
          
          @media (max-width: 768px) {
            .dashboard-container {
              flex-direction: column;
            }
            
            .sidebar {
              width: 100%;
              order: 2;
            }
            
            .main-content {
              order: 1;
              padding: 20px;
            }
            
            .dashboard-stats {
              grid-template-columns: 1fr;
            }
            
            .stores-grid {
              grid-template-columns: 1fr;
            }
            
            .filter-controls {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }
            
            .search-input {
              width: 100%;
              margin-right: 0;
            }
            
            .filter-select {
              width: 100%;
              margin-right: 0;
            }
            
            .api-status-grid {
              grid-template-columns: 1fr;
            }
            
            .endpoint-test-buttons {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </>
  );
}