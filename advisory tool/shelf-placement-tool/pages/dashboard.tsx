import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number | string;
  margin: number | string;
  size: string;
  buyingDecision: string;
  demand: string;
  slot: number;
}

interface Shelf {
  id: string;
  name: string;
  location: string;
  userId: string;
  userName: string;
  createdAt: string;
  products: Product[];
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userShelves, setUserShelves] = useState<Shelf[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalShelves: 0,
    avgProductsPerShelf: 0,
    mostUsedProduct: ""
  });

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/user-login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      
      // Check if user is verified
      if (!parsedUser.isVerified) {
        router.push("/verify-email");
        return;
      }
      
      setUser(parsedUser);
      
      // Load user's shelves
      loadUserShelves(parsedUser.id);
      
      // Load recent products
      loadRecentProducts();
      
    } catch (error) {
      console.error("Error parsing user data:", error);
      console.error("Error parsing user data:", error);
      router.push("/user-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadUserShelves = (userId: string) => {
    try {
      // Get all shelves from localStorage
      const allShelves = JSON.parse(localStorage.getItem("shelves") || "[]");
      
      // Filter shelves for current user
      const filteredShelves = allShelves.filter((shelf: Shelf) => shelf.userId === userId);
      
      setUserShelves(filteredShelves);
      
      // Calculate stats
      if (filteredShelves.length > 0) {
        const totalProducts = filteredShelves.reduce((sum: number, shelf: Shelf) => 
          sum + (shelf.products?.length || 0), 0);
          
        const avgProducts = totalProducts / filteredShelves.length;
        
        // Find most used product
        const productCounts: Record<string, number> = {};
        filteredShelves.forEach((shelf: Shelf) => {
          shelf.products?.forEach(product => {
            productCounts[product.name] = (productCounts[product.name] || 0) + 1;
          });
        });
        
        let mostUsedProduct = "";
        let maxCount = 0;
        
        for (const [name, count] of Object.entries(productCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostUsedProduct = name;
          }
        }
        
        setStats({
          totalProducts,
          totalShelves: filteredShelves.length,
          avgProductsPerShelf: avgProducts,
          mostUsedProduct
        });
      }
    } catch (error) {
      console.error("Error loading shelves:", error);
    }
  };

  const loadRecentProducts = () => {
    try {
      // Get all products from localStorage
      const allProducts = JSON.parse(localStorage.getItem("products") || "[]");
      
      // Sort by most recently added (assuming newer products are at the end of the array)
      const sortedProducts = [...allProducts].reverse().slice(0, 5);
      
      setRecentProducts(sortedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleCreateNewShelf = () => {
    router.push("/grid-selection");
  };

  const handleViewShelf = (shelfId: string) => {
    router.push(`/shelf-detail?id=${shelfId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/user-login");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
        
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
        <title>User Dashboard</title>
      </Head>
      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="logo">
            <h2>Product Placement</h2>
          </div>
          <nav className="nav-menu">
            <ul>
              <li className="active">
                <a href="#">Dashboard</a>
              </li>
              <li>
                <a href="/product-library">Products</a>
              </li>
              <li>
                <a href="/grid-selection">Create Shelf</a>
              </li>
              <li>
                <a href="/store-insights">Store Insights</a>
              </li>
              <li>
                <a href="#">Settings</a>
              </li>
            </ul>
          </nav>
          <div className="user-info">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <h4>{user?.name}</h4>
                <p>{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-button">
              Log Out
            </button>
          </div>
        </aside>
        
        <main className="main-content">
          <header className="dashboard-header">
            <h1>Welcome, {user?.name}</h1>
            <div className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </header>
          
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Shelves</h3>
              <div className="stat-value">{stats.totalShelves}</div>
              <p className="stat-label">Your created shelves</p>
            </div>
            <div className="stat-card">
              <h3>Total Products</h3>
              <div className="stat-value">{stats.totalProducts}</div>
              <p className="stat-label">Placed on shelves</p>
            </div>
            <div className="stat-card">
              <h3>Avg Products/Shelf</h3>
              <div className="stat-value">{stats.avgProductsPerShelf.toFixed(1)}</div>
              <p className="stat-label">Product density</p>
            </div>
            <div className="stat-card">
              <h3>Most Used Product</h3>
              <div className="stat-value">{stats.mostUsedProduct || "N/A"}</div>
              <p className="stat-label">Across all shelves</p>
            </div>
          </div>
          
          {/* User Shelves Section */}
          <div className="shelves-section">
            <div className="section-header">
              <h2>My Shelves</h2>
              <button onClick={handleCreateNewShelf} className="add-shelf-button">+ Create New Shelf</button>
            </div>
            
            <div className="shelves-grid">
              {userShelves.length === 0 ? (
                <div className="empty-shelves">
                  <div className="empty-icon">📚</div>
                  <h3>No shelves created yet</h3>
                  <p>Create your first shelf to start optimizing product placement</p>
                  <button onClick={handleCreateNewShelf} className="create-first-button">
                    Create Your First Shelf
                  </button>
                </div>
              ) : (
                userShelves.map((shelf) => (
                  <div key={shelf.id} className="shelf-card" onClick={() => handleViewShelf(shelf.id)}>
                    <div className="shelf-header">
                      <h3>{shelf.name || "Unnamed Shelf"}</h3>
                      <span className="product-count">{shelf.products?.length || 0} products</span>
                    </div>
                    <div className="shelf-preview">
                      <div className="grid-preview">
                        {/* 5x5 grid preview */}
                        {Array(25).fill(null).map((_, i) => (
                          <div key={i} className="grid-cell" style={{
                            backgroundColor: shelf.products?.some(p => p.slot === i) ? '#8b6f47' : '#e0c9a7'
                          }}></div>
                        ))}
                      </div>
                    </div>
                    <div className="shelf-footer">
                      <span>Created: {shelf.createdAt || 'Recently'}</span>
                      <span>Location: {shelf.location || 'Main Store'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="dashboard-panels">
            <div className="panel">
              <h3>Recent Products</h3>
              {recentProducts.length === 0 ? (
                <div className="no-products">
                  <p>No products added yet</p>
                  <button 
                    onClick={() => router.push("/product-entry")}
                    className="add-product-button"
                  >
                    Add New Product
                  </button>
                </div>
              ) : (
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Demand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</td>
                        <td>
                          <span className={`${product.demand?.toLowerCase()}-demand`}>
                            {product.demand}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="panel-footer">
                <button 
                  onClick={() => router.push("/product-library")}
                  className="view-all-button"
                >
                  View All Products
                </button>
              </div>
            </div>
            
            <div className="panel">
              <h3>Quick Actions</h3>
              <div className="action-cards">
                <div 
                  className="action-card"
                  onClick={() => router.push("/grid-selection")}
                >
                  <div className="action-icon">📊</div>
                  <h4>Create New Shelf</h4>
                  <p>Design a new 5×5 shelf layout</p>
                </div>
                <div 
                  className="action-card"
                  onClick={() => router.push("/product-entry")}
                >
                  <div className="action-icon">📦</div>
                  <h4>Add New Product</h4>
                  <p>Add a new product to your library</p>
                </div>
                <div 
                  className="action-card"
                  onClick={() => router.push("/store-insights")}
                >
                  <div className="action-icon">📈</div>
                  <h4>View Store Insights</h4>
                  <p>Analyze store performance data</p>
                </div>
                <div 
                  className="action-card"
                  onClick={() => router.push("/product-library")}
                >
                  <div className="action-icon">🔍</div>
                  <h4>Browse Products</h4>
                  <p>View and manage your product library</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <style jsx>{`
          .dashboard-container {
            display: flex;
            min-height: 100vh;
            font-family: 'Poppins', sans-serif;
          }
          
          /* Sidebar Styles */
          .sidebar {
            width: 280px;
            background: #8b6f47;
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
            margin: 0;
            font-size: 0.85rem;
            opacity: 0.7;
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
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .stat-label {
            margin: 0;
            color: #6b4f35;
            font-size: 0.9rem;
            opacity: 0.7;
          }
          
          /* Shelves Section */
          .shelves-section {
            margin-bottom: 30px;
          }
          
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .section-header h2 {
            color: #6b4f35;
            margin: 0;
            font-size: 1.5rem;
          }
          
          .add-shelf-button {
            background: #8b6f47;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
          }
          
          .add-shelf-button:hover {
            background: #7a5d3a;
          }
          
          .shelves-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }
          
          .shelf-card {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
          }
          
          .shelf-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
          }
          
          .shelf-header {
            background: #e0c9a7;
            color: #6b4f35;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .shelf-header h3 {
            margin: 0;
            font-size: 1.2rem;
          }
          
          .product-count {
            background: rgba(139, 111, 71, 0.2);
            color: #6b4f35;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
          }
          
          .shelf-preview {
            padding: 20px;
            background: #f8f4ef;
          }
          
          .grid-preview {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 3px;
            aspect-ratio: 1/1;
          }
          
          .grid-cell {
            border-radius: 2px;
          }
          
          .shelf-footer {
            padding: 15px;
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
            color: #7d6450;
            border-top: 1px solid #f0e6d9;
          }
          
          .empty-shelves {
            grid-column: 1 / -1;
            background: white;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          
          .empty-icon {
            font-size: 3rem;
            margin-bottom: 15px;
          }
          
          .empty-shelves h3 {
            color: #6b4f35;
            margin-bottom: 10px;
            font-size: 1.3rem;
          }
          
          .empty-shelves p {
            color: #7d6450;
            margin-bottom: 20px;
          }
          
          .create-first-button {
            background: #8b6f47;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
          }
          
          .create-first-button:hover {
            background: #7a5d3a;
          }
          
          .dashboard-panels {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .panel {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          
          .panel h3 {
            margin: 0 0 20px;
            color: #6b4f35;
            font-size: 1.2rem;
          }
          
          .product-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .product-table th, .product-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          
          .product-table th {
            color: #6b4f35;
            font-weight: bold;
            opacity: 0.7;
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
            color: #757575;
            background: rgba(117, 117, 117, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: bold;
          }
          
          .seasonal-demand {
            color: #7e57c2;
            background: rgba(126, 87, 194, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: bold;
          }
          
          .no-products {
            text-align: center;
            padding: 20px 0;
            color: #7d6450;
          }
          
          .add-product-button {
            background: #8b6f47;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            margin-top: 10px;
            cursor: pointer;
            font-weight: bold;
          }
          
          .panel-footer {
            margin-top: 15px;
            text-align: center;
          }
          
          .view-all-button {
            background: transparent;
            color: #8b6f47;
            border: 1px solid #8b6f47;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
          }
          
          .view-all-button:hover {
            background: #8b6f47;
            color: white;
          }
          
          .action-cards {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          
          .action-card {
            background: #f8f4ef;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.3s, background 0.3s;
          }
          
          .action-card:hover {
            transform: translateY(-5px);
            background: #f0e6d9;
          }
          
          .action-icon {
            font-size: 2rem;
            margin-bottom: 10px;
          }
          
          .action-card h4 {
            margin: 0 0 5px;
            color: #6b4f35;
            font-size: 1rem;
          }
          
          .action-card p {
            margin: 0;
            color: #7d6450;
            font-size: 0.85rem;
          }
          
          @media (max-width: 1024px) {
            .dashboard-panels {
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
            
            .action-cards {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </>
  );
}