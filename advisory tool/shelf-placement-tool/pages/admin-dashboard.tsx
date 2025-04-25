// admin-dashboard.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import ApiService from "../utils/api-service";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
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
  id: string;
  name: string;
  category: string;
  price: number;
  margin: number;
  size: string;
  demand: string;
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
  placedDate: string;
}

interface PlacementData {
  position: string;
  products: {
    productId: string;
    productName: string;
    userName: string;
    placedDate: string;
  }[];
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
  const [selectedStore, setSelectedStore] = useState<string>("all");
  
  // Filter states
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productDemandFilter, setProductDemandFilter] = useState("all");

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem("admin");
    if (!adminData) {
      router.push("/admin-login");
      return;
    }

    try {
      const parsedAdmin = JSON.parse(adminData);
      setAdmin(parsedAdmin);
      
      // Fetch all necessary data
      fetchUsers();
      fetchProducts();
      fetchStores();
      fetchShelfGrid();
      
    } catch (error) {
      console.error("Error parsing admin data:", error);
      localStorage.removeItem("admin");
      router.push("/admin-login");
      return;
    }
    
    setLoading(false);
  }, [router]);
  
  useEffect(() => {
    if (shelfGrid.length > 0 && products.length > 0 && users.length > 0) {
      processPlacementData();
    }
  }, [shelfGrid, products, users, selectedStore]);
  
  // Mock data fetching functions - replace with actual API calls
  const fetchUsers = async () => {
    try {
      // const response = await ApiService.getUsers();
      // setUsers(response.data);
      
      // Mock data
      const mockUsers: User[] = [
        { id: "u1", name: "John Doe", email: "john.doe@example.com", storeId: "s1", status: "verified", registeredDate: "2025-02-10" },
        { id: "u2", name: "Jane Smith", email: "jane.smith@example.com", storeId: "s1", status: "verified", registeredDate: "2025-02-11" },
        { id: "u3", name: "Michael Johnson", email: "michael@example.com", storeId: "s2", status: "verified", registeredDate: "2025-02-12" },
        { id: "u4", name: "Sarah Williams", email: "sarah@example.com", storeId: "s2", status: "verified", registeredDate: "2025-02-13" },
        { id: "u5", name: "Robert Brown", email: "robert@example.com", storeId: "s3", status: "pending", registeredDate: "2025-02-14" },
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  
  const fetchProducts = async () => {
    try {
      // const response = await ApiService.getProducts();
      // setProducts(response.data);
      
      // Mock data
      const mockProducts: Product[] = [
        { id: "p1", name: "Colgate Toothpaste", category: "Health", price: 3.22, margin: 0.22, size: "34 oz", demand: "high" },
        { id: "p2", name: "Nike T-Shirt", category: "Fashion", price: 54.00, margin: 5.00, size: "M", demand: "high" },
        { id: "p3", name: "Adidas Shoes", category: "Fashion", price: 89.00, margin: 12.00, size: "9", demand: "high" },
        { id: "p4", name: "Tennis Racket", category: "Sports", price: 34.00, margin: 3.00, size: "Standard", demand: "medium" },
        { id: "p5", name: "Chocolate Bar", category: "Food", price: 8.00, margin: 0.80, size: "3 oz", demand: "high" },
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  
  const fetchStores = async () => {
    try {
      // const response = await ApiService.getStores();
      // setStores(response.data);
      
      // Mock data
      const mockStores: Store[] = [
        { id: "s1", name: "Store A", status: "active", salesVolume: 5000, profitConversion: 80, customerTraffic: 1200 },
        { id: "s2", name: "Store B", status: "active", salesVolume: 3500, profitConversion: 60, customerTraffic: 950 },
        { id: "s3", name: "Store C", status: "maintenance", salesVolume: 2000, profitConversion: 30, customerTraffic: 600 },
      ];
      setStores(mockStores);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };
  
  const fetchShelfGrid = async () => {
    try {
      // const response = await ApiService.getShelfGrid();
      // setShelfGrid(response.data);
      
      // Mock data
      const mockShelfGrid: ShelfGridItem[] = [
        { gridId: "g1", shelfPosition: "A1", productId: "p1", userId: "u1", placedDate: "2025-04-01" },
        { gridId: "g2", shelfPosition: "A1", productId: "p2", userId: "u2", placedDate: "2025-04-02" }, // Overlapping
        { gridId: "g3", shelfPosition: "A2", productId: "p3", userId: "u1", placedDate: "2025-04-03" },
        { gridId: "g4", shelfPosition: "B1", productId: "p4", userId: "u3", placedDate: "2025-04-04" },
        { gridId: "g5", shelfPosition: "B2", productId: "p5", userId: "u2", placedDate: "2025-04-05" },
        { gridId: "g6", shelfPosition: "B2", productId: "p1", userId: "u4", placedDate: "2025-04-06" }, // Overlapping
        { gridId: "g7", shelfPosition: "C1", productId: "p2", userId: "u4", placedDate: "2025-04-07" },
        { gridId: "g8", shelfPosition: "C2", productId: "p3", userId: "u3", placedDate: "2025-04-08" },
        { gridId: "g9", shelfPosition: "C2", productId: "p4", userId: "u5", placedDate: "2025-04-09" }, // Overlapping
      ];
      setShelfGrid(mockShelfGrid);
    } catch (error) {
      console.error("Error fetching shelf grid:", error);
    }
  };
  
  const processPlacementData = () => {
    const placements: { [key: string]: PlacementData } = {};
    
    // Filter by store if needed
    const filteredShelfGrid = selectedStore === "all" 
      ? shelfGrid 
      : shelfGrid.filter(item => {
          const user = users.find(u => u.id === item.userId);
          return user?.storeId === selectedStore;
        });
    
    // Group by position
    filteredShelfGrid.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const user = users.find(u => u.id === item.userId);
      
      if (!product || !user) return;
      
      if (!placements[item.shelfPosition]) {
        placements[item.shelfPosition] = {
          position: item.shelfPosition,
          products: []
        };
      }
      
      placements[item.shelfPosition].products.push({
        productId: item.productId,
        productName: product.name,
        userName: user.name,
        placedDate: item.placedDate
      });
    });
    
    // Convert to array and sort
    const placementsArray = Object.values(placements).sort((a, b) => a.position.localeCompare(b.position));
    setPlacementData(placementsArray);
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
              <li className={activeTab === "users" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("users");}}>User Management</a>
              </li>
              <li className={activeTab === "products" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("products");}}>Products</a>
              </li>
              <li className={activeTab === "stores" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("stores");}}>Store Management</a>
              </li>
              <li className={activeTab === "settings" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("settings");}}>Settings</a>
              </li>
            </ul>
          </nav>
          <div className="user-info">
            <div className="user-profile">
              <div className="user-avatar">
                {admin?.name?.charAt(0).toUpperCase() || 'A'}
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
                  <p>↑ 15% from last month</p>
                </div>
                <div className="stat-card">
                  <h3>Total Products</h3>
                  <div className="stat-value">{products.length}</div>
                  <p>↑ 8% from last month</p>
                </div>
                <div className="stat-card">
                  <h3>Active Stores</h3>
                  <div className="stat-value">{stores.filter(s => s.status === 'active').length}</div>
                  <p>↑ 2 new stores this month</p>
                </div>
                <div className="stat-card">
                  <h3>Product Placements</h3>
                  <div className="stat-value">{shelfGrid.length}</div>
                  <p>↑ 12% from last month</p>
                </div>
              </div>
              
              <div className="dashboard-panels">
                <div className="panel">
                  <h3>Recent Product Placements</h3>
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
                          const user = users.find(u => u.id === item.userId);
                          
                          return (
                            <tr key={index}>
                              <td>{item.shelfPosition}</td>
                              <td>{product?.name || 'Unknown Product'}</td>
                              <td>{user?.name || 'Unknown User'}</td>
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
                </div>
                
                <div className="panel">
                  <h3>Recent User Activity</h3>
                  <div className="activity-list">
                    {shelfGrid
                      .sort((a, b) => new Date(b.placedDate).getTime() - new Date(a.placedDate).getTime())
                      .slice(0, 5)
                      .map((item, index) => {
                        const product = products.find(p => p.id === item.productId);
                        const user = users.find(u => u.id === item.userId);
                        
                        return (
                          <div className="activity-item" key={index}>
                            <div className="activity-icon product-placed"></div>
                            <div className="activity-content">
                              <h4>Product Placement</h4>
                              <p>{user?.name || 'Unknown User'} placed {product?.name || 'Unknown Product'} at position {item.shelfPosition}</p>
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
                </div>
              </div>
              
              <div className="panel system-overview">
                <h3>Store Performance Overview</h3>
                <div className="stores-grid mini-view">
                  {stores.map((store, index) => (
                    <div className="store-card mini" key={index}>
                      <div className="store-header">
                        <h3>{store.name}</h3>
                        <span className={`store-badge ${store.status}`}>{store.status}</span>
                      </div>
                      <div className="store-details">
                        <div className="store-info-row">
                          <span className="store-info-label">Sales:</span>
                          <span className="store-info-value">${store.salesVolume}</span>
                        </div>
                        <div className="store-info-row">
                          <span className="store-info-label">Conversion:</span>
                          <span className="store-info-value">{store.profitConversion}%</span>
                        </div>
                        <div className="store-info-row">
                          <span className="store-info-label">Traffic:</span>
                          <span className="store-info-value">{store.customerTraffic}/day</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <th>Actions</th>
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
                        <td>
                          <button className="action-button edit">Edit</button>
                          <button className="action-button delete">Clear</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "users" && (
            <>
              <header className="dashboard-header">
                <h1>User Management</h1>
                <button className="add-new-button">Add New User</button>
              </header>
              
              <div className="panel">
                <div className="panel-actions user-filters">
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
                
                <table className="user-table full-width">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Store</th>
                      <th>Registered</th>
                      <th>Status</th>
                      <th>Actions</th>
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
                          <td>
                            <div className="action-buttons">
                              <button className="action-button edit">Edit</button>
                              <button className="action-button delete">Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                <div className="pagination">
                  <button className="pagination-button">Previous</button>
                  <div className="pagination-numbers">
                    <button className="pagination-number active">1</button>
                    <button className="pagination-number">2</button>
                    <button className="pagination-number">3</button>
                  </div>
                  <button className="pagination-button">Next</button>
                </div>
              </div>
            </>
          )}

          {activeTab === "products" && (
            <>
              <header className="dashboard-header">
                <h1>Products Management</h1>
                <button className="add-new-button">Add New Product</button>
              </header>
              
              <div className="panel">
                <div className="panel-actions product-filters">
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    className="search-input"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
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
                
                <table className="product-table full-width">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Margin</th>
                      <th>Size</th>
                      <th>Demand</th>
                      <th>Actions</th>
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
                        <td>
                          <div className="action-buttons">
                            <button className="action-button edit">Edit</button>
                            <button className="action-button delete">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="pagination">
                  <button className="pagination-button">Previous</button>
                  <div className="pagination-numbers">
                    <button className="pagination-number active">1</button>
                    <button className="pagination-number">2</button>
                    <button className="pagination-number">3</button>
                  </div>
                  <button className="pagination-button">Next</button>
                </div>
              </div>
            </>
          )}

          {activeTab === "stores" && (
            <>
              <header className="dashboard-header">
                <h1>Store Management</h1>
                <button className="add-new-button">Add New Store</button>
              </header>
              
              <div className="stores-grid">
                {stores.map((store, index) => (
                  <div className="store-card" key={index}>
                    <div className="store-header">
                      <h3>{store.name}</h3>
                      <span className={`store-badge ${store.status}`}>{store.status}</span>
                      </div>
                    <div className="store-details">
                      <div className="store-info-row">
                        <span className="store-info-label">Sales Volume:</span>
                        <span className="store-info-value">${store.salesVolume}</span>
                      </div>
                      <div className="store-info-row">
                        <span className="store-info-label">Profit Conversion:</span>
                        <span className="store-info-value">{store.profitConversion}%</span>
                      </div>
                      <div className="store-info-row">
                        <span className="store-info-label">Customer Traffic:</span>
                        <span className="store-info-value">{store.customerTraffic}/day</span>
                      </div>
                    </div>
                    <div className="store-actions">
                      <button className="store-action-button">View Details</button>
                      <button className="store-action-button">Edit Layout</button>
                    </div>
                  </div>
                ))}
                
                <div className="store-card add-store-card">
                  <div className="add-store-content">
                    <div className="add-store-icon">+</div>
                    <h3>Add New Store</h3>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <header className="dashboard-header">
                <h1>System Settings</h1>
                <button className="save-settings-button">Save Changes</button>
              </header>
              
              <div className="settings-panels">
                <div className="panel settings-panel">
                  <h3>Account Settings</h3>
                  
                  <div className="settings-form">
                    <div className="settings-group">
                      <label className="settings-label">Admin Name</label>
                      <input type="text" className="settings-input" defaultValue={admin?.name || 'Admin User'} />
                    </div>
                    
                    <div className="settings-group">
                      <label className="settings-label">Email Address</label>
                      <input type="email" className="settings-input" defaultValue={admin?.email || 'admin@example.com'} />
                    </div>
                    
                    <div className="settings-group">
                      <label className="settings-label">Password</label>
                      <input type="password" className="settings-input" defaultValue="••••••••" />
                      <button className="change-password-button">Change Password</button>
                    </div>
                  </div>
                </div>
                
                <div className="panel settings-panel">
                  <h3>System Settings</h3>
                  
                  <div className="settings-form">
                    <div className="settings-group">
                      <label className="settings-label">System Name</label>
                      <input type="text" className="settings-input" defaultValue="Product Placement Advisory System" />
                    </div>
                    
                    <div className="settings-group">
                      <label className="settings-label">Email Notifications</label>
                      <div className="toggle-switch-container">
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="toggle-label">Enable email notifications for new product placements</span>
                      </div>
                    </div>
                    
                    <div className="settings-group">
                      <label className="settings-label">Auto-backup Frequency</label>
                      <select className="settings-select">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div className="settings-group">
                      <label className="settings-label">Default Currency</label>
                      <select className="settings-select">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                    
                    <div className="backup-actions">
                      <button className="backup-button">Create Backup Now</button>
                      <button className="backup-button">Restore from Backup</button>
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
            margin-bottom: 15px;
          }
          
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
          
          .view-all-button {
            background: transparent;
            color: #7a5d3a;
            border: 1px solid #7a5d3a;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
          }
          
          .view-all-button:hover {
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
          
          .add-store-card {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(122, 93, 58, 0.05);
            border: 2px dashed rgba(122, 93, 58, 0.2);
            cursor: pointer;
            transition: all 0.3s;
          }
          
          .add-store-card:hover {
            background: rgba(122, 93, 58, 0.1);
          }
          
          .add-store-content {
            text-align: center;
            color: #7a5d3a;
          }
          
          .add-store-icon {
            font-size: 2rem;
            margin-bottom: 10px;
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
          
          .user-filters, .product-filters {
            display: flex;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .add-new-button {
            background: #7a5d3a;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
          }
          
          .add-new-button:hover {
            background: #6b4f35;
          }
          
          .full-width {
            width: 100%;
          }
          
          .action-buttons {
            display: flex;
            gap: 5px;
          }
          
          .action-button {
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            border: none;
            cursor: pointer;
          }
          
          .action-button.edit {
            background: rgba(3, 169, 244, 0.1);
            color: #0288d1;
          }
          
          .action-button.delete {
            background: rgba(244, 67, 54, 0.1);
            color: #d32f2f;
          }
          
          .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
          }
          
          .pagination-button {
            padding: 8px 15px;
            background: transparent;
            color: #7a5d3a;
            border: 1px solid #7a5d3a;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
          }
          
          .pagination-button:hover {
            background: #7a5d3a;
            color: white;
          }
          
          .pagination-numbers {
            display: flex;
            gap: 5px;
            align-items: center;
          }
          
          .pagination-number {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: transparent;
            border: 1px solid #ddd;
            cursor: pointer;
            transition: all 0.3s;
          }
          
          .pagination-number.active {
            background: #7a5d3a;
            color: white;
            border-color: #7a5d3a;
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
          
          /* Settings Tab Styles */
          .settings-panels {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
          }
          
          .settings-panel {
            margin-bottom: 0;
          }
          
          .settings-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .settings-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
            margin-bottom: 15px;
          }
          
          .settings-label {
            font-size: 0.9rem;
            color: #6b4f35;
            font-weight: bold;
          }
          
          .settings-input, .settings-select {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
          }
          
          .settings-input:focus, .settings-select:focus {
            outline: none;
            border-color: #7a5d3a;
            box-shadow: 0 0 0 2px rgba(122, 93, 58, 0.1);
          }
          
          .toggle-switch-container {
            display: flex;
            align-items: center;
          }
          
          .toggle-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
            margin-right: 10px;
          }
          
          .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          
          .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 24px;
          }
          
          .toggle-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
          }
          
          input:checked + .toggle-slider {
            background-color: #7a5d3a;
          }
          
          input:checked + .toggle-slider:before {
            transform: translateX(26px);
          }
          
          .toggle-label {
            font-size: 0.9rem;
            color: #6b4f35;
          }
          
          .change-password-button {
            background: transparent;
            color: #7a5d3a;
            border: none;
            text-decoration: underline;
            cursor: pointer;
            padding: 0;
            font-size: 0.85rem;
            margin-top: 5px;
            align-self: flex-start;
          }
          
          .backup-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
          }
          
          .backup-button {
            flex: 1;
            padding: 10px;
            background: #7a5d3a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.3s;
          }
          
          .backup-button:hover {
            background: #6b4f35;
          }
          
          .save-settings-button {
            background: #7a5d3a;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
          }
          
          .save-settings-button:hover {
            background: #6b4f35;
          }
          
          /* Responsive Styles */
          @media (max-width: 1024px) {
            .dashboard-panels {
              grid-template-columns: 1fr;
            }
            
            .shelf-grid {
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
            
            .settings-panels {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </> 
  );
}