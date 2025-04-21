// admin-dashboard.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import ApiService from "../utils/api-service";

interface Admin {
  id: string;
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

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
    } catch (error) {
      console.error("Error parsing admin data:", error);
      localStorage.removeItem("admin");
      router.push("/admin-login");
      return;
    }
    
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    router.push("/admin-login");
  };

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
              <li className={activeTab === "users" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("users");}}>User Management</a>
              </li>
              <li className={activeTab === "products" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("products");}}>Products</a>
              </li>
              <li className={activeTab === "stores" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("stores");}}>Store Management</a>
              </li>
              <li className={activeTab === "analytics" ? "active" : ""}>
                <a href="#" onClick={(e) => {e.preventDefault(); setActiveTab("analytics");}}>Analytics</a>
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
                <span className="admin-badge">Admin</span>
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
                  <div className="stat-value">1,245</div>
                  <p>↑ 15% from last month</p>
                </div>
                <div className="stat-card">
                  <h3>Total Products</h3>
                  <div className="stat-value">578</div>
                  <p>↑ 8% from last month</p>
                </div>
                <div className="stat-card">
                  <h3>Active Stores</h3>
                  <div className="stat-value">32</div>
                  <p>↑ 2 new stores this month</p>
                </div>
                <div className="stat-card">
                  <h3>Total Revenue</h3>
                  <div className="stat-value">$124,582</div>
                  <p>↑ 12% from last month</p>
                </div>
              </div>
              
              <div className="dashboard-panels">
                <div className="panel">
                  <h3>Recent User Registrations</h3>
                  <table className="user-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Registered</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>John Doe</td>
                        <td>john.doe@example.com</td>
                        <td>2 days ago</td>
                        <td><span className="user-status verified">Verified</span></td>
                      </tr>
                      <tr>
                        <td>Jane Smith</td>
                        <td>jane.smith@example.com</td>
                        <td>3 days ago</td>
                        <td><span className="user-status verified">Verified</span></td>
                      </tr>
                      <tr>
                        <td>Michael Johnson</td>
                        <td>michael@example.com</td>
                        <td>5 days ago</td>
                        <td><span className="user-status verified">Verified</span></td>
                      </tr>
                      <tr>
                        <td>Sarah Williams</td>
                        <td>sarah@example.com</td>
                        <td>1 week ago</td>
                        <td><span className="user-status verified">Verified</span></td>
                      </tr>
                      <tr>
                        <td>Robert Brown</td>
                        <td>robert@example.com</td>
                        <td>2 weeks ago</td>
                        <td><span className="user-status pending">Pending</span></td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="panel-actions">
                    <button 
                      className="view-all-button" 
                      onClick={() => setActiveTab("users")}
                    >
                      View All Users
                    </button>
                  </div>
                </div>
                
                <div className="panel">
                  <h3>System Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-icon product-added"></div>
                      <div className="activity-content">
                        <h4>New Product Added</h4>
                        <p>Nike Air Max 90 has been added to the products database</p>
                        <span className="activity-time">2 hours ago</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon user-registered"></div>
                      <div className="activity-content">
                        <h4>New User Registration</h4>
                        <p>Emily Davis has registered as a new user</p>
                        <span className="activity-time">5 hours ago</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon store-updated"></div>
                      <div className="activity-content">
                        <h4>Store Layout Updated</h4>
                        <p>Store A has updated their floor layout</p>
                        <span className="activity-time">1 day ago</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon system-updated"></div>
                      <div className="activity-content">
                        <h4>System Update</h4>
                        <p>Product placement algorithm updated to version 2.4</p>
                        <span className="activity-time">2 days ago</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon report-generated"></div>
                      <div className="activity-content">
                        <h4>Monthly Report Generated</h4>
                        <p>March 2025 revenue report has been generated</p>
                        <span className="activity-time">3 days ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="panel-actions">
                    <button className="view-all-button">View All Activity</button>
                  </div>
                </div>
              </div>
              
              <div className="panel system-overview">
                <h3>System Overview</h3>
                <div className="system-stats">
                  <div className="system-stat-item">
                    <div className="system-stat-label">CPU Usage</div>
                    <div className="system-stat-bar">
                      <div className="system-stat-progress" style={{ width: '45%' }}></div>
                    </div>
                    <div className="system-stat-value">45%</div>
                  </div>
                  <div className="system-stat-item">
                    <div className="system-stat-label">Memory Usage</div>
                    <div className="system-stat-bar">
                      <div className="system-stat-progress" style={{ width: '62%' }}></div>
                    </div>
                    <div className="system-stat-value">62%</div>
                  </div>
                  <div className="system-stat-item">
                    <div className="system-stat-label">Disk Space</div>
                    <div className="system-stat-bar">
                      <div className="system-stat-progress" style={{ width: '78%' }}></div>
                    </div>
                    <div className="system-stat-value">78%</div>
                  </div>
                  <div className="system-stat-item">
                    <div className="system-stat-label">Network Usage</div>
                    <div className="system-stat-bar">
                      <div className="system-stat-progress" style={{ width: '35%' }}></div>
                    </div>
                    <div className="system-stat-value">35%</div>
                  </div>
                </div>
                <div className="system-info">
                  <div className="system-info-item">
                    <span className="system-info-label">Server Status:</span>
                    <span className="system-info-value online">Online</span>
                  </div>
                  <div className="system-info-item">
                    <span className="system-info-label">Last Backup:</span>
                    <span className="system-info-value">12 hours ago</span>
                  </div>
                  <div className="system-info-item">
                    <span className="system-info-label">System Version:</span>
                    <span className="system-info-value">1.5.2</span>
                  </div>
                  <div className="system-info-item">
                    <span className="system-info-label">Database Status:</span>
                    <span className="system-info-value online">Healthy</span>
                  </div>
                </div>
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
                  <input type="text" placeholder="Search users..." className="search-input" />
                  <select className="filter-select">
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
                      <th>Registered</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(10)].map((_, i) => (
                      <tr key={i}>
                        <td>User {i + 1}</td>
                        <td>user{i + 1}@example.com</td>
                        <td>{Math.floor(Math.random() * 30) + 1} days ago</td>
                        <td>
                          <span className={`user-status ${i % 5 === 0 ? 'pending' : 'verified'}`}>
                            {i % 5 === 0 ? 'Pending' : 'Verified'}
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
                    <span>...</span>
                    <button className="pagination-number">10</button>
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
                  <input type="text" placeholder="Search products..." className="search-input" />
                  <select className="filter-select">
                    <option value="all">All Categories</option>
                    <option value="health">Health</option>
                    <option value="fashion">Fashion</option>
                    <option value="sports">Sports</option>
                    <option value="food">Food</option>
                  </select>
                  <select className="filter-select">
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
                    <tr>
                      <td>Colgate Toothpaste</td>
                      <td>Health</td>
                      <td>$3.22</td>
                      <td>$0.22</td>
                      <td>34 oz</td>
                      <td><span className="high-demand">High</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button edit">Edit</button>
                          <button className="action-button delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Nike T-Shirt</td>
                      <td>Fashion</td>
                      <td>$54.00</td>
                      <td>$5.00</td>
                      <td>M</td>
                      <td><span className="high-demand">High</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button edit">Edit</button>
                          <button className="action-button delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Adidas Shoes</td>
                      <td>Fashion</td>
                      <td>$54.00</td>
                      <td>$5.00</td>
                      <td>9</td>
                      <td><span className="high-demand">High</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button edit">Edit</button>
                          <button className="action-button delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Tennis Racket</td>
                      <td>Sports</td>
                      <td>$34.00</td>
                      <td>$3.00</td>
                      <td>Standard</td>
                      <td><span className="medium-demand">Medium</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button edit">Edit</button>
                          <button className="action-button delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Chocolate Bar</td>
                      <td>Food</td>
                      <td>$8.00</td>
                      <td>$0.80</td>
                      <td>3 oz</td>
                      <td><span className="high-demand">High</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-button edit">Edit</button>
                          <button className="action-button delete">Delete</button>
                        </div>
                      </td>
                    </tr>
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
                <div className="store-card">
                  <div className="store-header">
                    <h3>Store A</h3>
                    <span className="store-badge active">Active</span>
                  </div>
                  <div className="store-details">
                    <div className="store-info-row">
                      <span className="store-info-label">Sales Volume:</span>
                      <span className="store-info-value">$5,000</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Profit Conversion:</span>
                      <span className="store-info-value">80%</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Customer Traffic:</span>
                      <span className="store-info-value">1,200/day</span>
                    </div>
                  </div>
                  <div className="store-actions">
                    <button className="store-action-button">View Details</button>
                    <button className="store-action-button">Edit Layout</button>
                  </div>
                </div>
                
                <div className="store-card">
                  <div className="store-header">
                    <h3>Store B</h3>
                    <span className="store-badge active">Active</span>
                  </div>
                  <div className="store-details">
                    <div className="store-info-row">
                      <span className="store-info-label">Sales Volume:</span>
                      <span className="store-info-value">$3,500</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Profit Conversion:</span>
                      <span className="store-info-value">60%</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Customer Traffic:</span>
                      <span className="store-info-value">950/day</span>
                    </div>
                  </div>
                  <div className="store-actions">
                    <button className="store-action-button">View Details</button>
                    <button className="store-action-button">Edit Layout</button>
                  </div>
                </div>
                
                <div className="store-card">
                  <div className="store-header">
                    <h3>Store C</h3>
                    <span className="store-badge maintenance">Maintenance</span>
                  </div>
                  <div className="store-details">
                    <div className="store-info-row">
                      <span className="store-info-label">Sales Volume:</span>
                      <span className="store-info-value">$2,000</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Profit Conversion:</span>
                      <span className="store-info-value">30%</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Customer Traffic:</span>
                      <span className="store-info-value">600/day</span>
                    </div>
                  </div>
                  <div className="store-actions">
                    <button className="store-action-button">View Details</button>
                    <button className="store-action-button">Edit Layout</button>
                  </div>
                </div>
                
                <div className="store-card">
                  <div className="store-header">
                    <h3>Store D</h3>
                    <span className="store-badge active">Active</span>
                  </div>
                  <div className="store-details">
                    <div className="store-info-row">
                      <span className="store-info-label">Sales Volume:</span>
                      <span className="store-info-value">$6,000</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Profit Conversion:</span>
                      <span className="store-info-value">85%</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Customer Traffic:</span>
                      <span className="store-info-value">1,500/day</span>
                    </div>
                  </div>
                  <div className="store-actions">
                    <button className="store-action-button">View Details</button>
                    <button className="store-action-button">Edit Layout</button>
                  </div>
                </div>
                
                <div className="store-card">
                  <div className="store-header">
                    <h3>Store E</h3>
                    <span className="store-badge active">Active</span>
                  </div>
                  <div className="store-details">
                    <div className="store-info-row">
                      <span className="store-info-label">Sales Volume:</span>
                      <span className="store-info-value">$4,000</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Profit Conversion:</span>
                      <span className="store-info-value">55%</span>
                    </div>
                    <div className="store-info-row">
                      <span className="store-info-label">Customer Traffic:</span>
                      <span className="store-info-value">1,100/day</span>
                    </div>
                  </div>
                  <div className="store-actions">
                    <button className="store-action-button">View Details</button>
                    <button className="store-action-button">Edit Layout</button>
                  </div>
                </div>
                
                <div className="store-card add-store-card">
                  <div className="add-store-content">
                    <div className="add-store-icon">+</div>
                    <h3>Add New Store</h3>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "analytics" && (
            <>
              <header className="dashboard-header">
                <h1>Analytics</h1>
                <div className="date-range-picker">
                  <select className="date-range-select">
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="customRange">Custom Range</option>
                  </select>
                </div>
              </header>
              
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Total Sales</h3>
                  <div className="stat-value">$45,245</div>
                  <p>↑ 12% from previous period</p>
                </div>
                <div className="stat-card">
                  <h3>Average Order Value</h3>
                  <div className="stat-value">$67.32</div>
                  <p>↑ 5% from previous period</p>
                </div>
                <div className="stat-card">
                  <h3>Conversion Rate</h3>
                  <div className="stat-value">3.2%</div>
                  <p>↑ 0.5% from previous period</p>
                </div>
                <div className="stat-card">
                  <h3>Customer Visits</h3>
                  <div className="stat-value">12,450</div>
                  <p>↑ 18% from previous period</p>
                </div>
              </div>
              
              <div className="analytics-charts">
                <div className="panel chart-panel">
                  <h3>Sales Performance</h3>
                  <div className="chart-placeholder">
                    <div className="chart-message">Sales Chart Visualization</div>
                    <div className="mock-chart">
                      <div className="mock-bar" style={{ height: '60%' }}></div>
                      <div className="mock-bar" style={{ height: '75%' }}></div>
                      <div className="mock-bar" style={{ height: '45%' }}></div>
                      <div className="mock-bar" style={{ height: '90%' }}></div>
                      <div className="mock-bar" style={{ height: '70%' }}></div>
                      <div className="mock-bar" style={{ height: '80%' }}></div>
                      <div className="mock-bar" style={{ height: '65%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="panel chart-panel">
                  <h3>Product Category Distribution</h3>
                  <div className="chart-placeholder">
                    <div className="chart-message">Category Distribution Pie Chart</div>
                    <div className="mock-pie-chart">
                      <div className="pie-segment segment1"></div>
                      <div className="pie-segment segment2"></div>
                      <div className="pie-segment segment3"></div>
                      <div className="pie-segment segment4"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="panel">
                <h3>Top Selling Products</h3>
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                      <th>Trend</th>
                    </tr>
                  </thead>

                  <tbody>
  <tr>
    <td>Nike Air Max 90</td>
    <td>Fashion</td>
    <td>435</td>
    <td>$39,150</td>
    <td>
      <div className="trend-indicator positive">↑ 15%</div>
    </td>
  </tr>
  <tr>
    <td>Colgate Total</td>
    <td>Health</td>
    <td>1,245</td>
    <td>$4,042</td>
    <td>
      <div className="trend-indicator positive">↑ 8%</div>
    </td>
  </tr>
  <tr>
    <td>Lindt Chocolate</td>
    <td>Food</td>
    <td>950</td>
    <td>$7,600</td>
    <td>
      <div className="trend-indicator positive">↑ 12%</div>
    </td>
  </tr>
  <tr>
    <td>Sony Headphones</td>
    <td>Electronics</td>
    <td>320</td>
    <td>$25,600</td>
    <td>
      <div className="trend-indicator negative">↓ 3%</div>
    </td>
  </tr>
  <tr>
    <td>Protein Powder</td>
    <td>Health</td>
    <td>650</td>
    <td>$19,500</td>
    <td>
      <div className="trend-indicator positive">↑ 25%</div>
    </td>
  </tr>
</tbody>
</table>
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
        
        <div className="settings-group">
          <label className="settings-label">Admin Role</label>
          <select className="settings-select">
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
          </select>
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
            <span className="toggle-label">Enable email notifications for new users</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label className="settings-label">User Registration</label>
          <div className="toggle-switch-container">
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">Allow new user registrations</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label className="settings-label">Maintenance Mode</label>
          <div className="toggle-switch-container">
            <label className="toggle-switch">
              <input type="checkbox" />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">Enable maintenance mode</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label className="settings-label">Default Currency</label>
          <select className="settings-select">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="CAD">CAD ($)</option>
          </select>
        </div>
        
        <div className="settings-group">
          <label className="settings-label">Date Format</label>
          <select className="settings-select">
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
    
    <div className="panel settings-panel">
      <h3>Backup & Maintenance</h3>
      
      <div className="settings-form">
        <div className="settings-group">
          <label className="settings-label">Automatic Backups</label>
          <div className="toggle-switch-container">
            <label className="toggle-switch">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">Enable automatic daily backups</span>
          </div>
        </div>
        
        <div className="settings-group">
          <label className="settings-label">Backup Frequency</label>
          <select className="settings-select">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        
        <div className="settings-group backup-actions">
          <button className="backup-button">Create Backup Now</button>
          <button className="backup-button">Restore from Backup</button>
        </div>
        
        <div className="settings-group">
          <label className="settings-label">Log Retention</label>
          <select className="settings-select">
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">365 days</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</>
)}
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
  }
  
  .panel h3 {
    margin: 0 0 20px;
    color: #6b4f35;
    font-size: 1.2rem;
  }
  
  .user-table, .product-table, .analytics-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .user-table th, .user-table td, 
  .product-table th, .product-table td,
  .analytics-table th, .analytics-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  .user-table th, .product-table th, .analytics-table th {
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
  
  .activity-icon:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
  
  .activity-icon.product-added {
    background: rgba(56, 142, 60, 0.1);
  }
  
  .activity-icon.user-registered {
    background: rgba(3, 169, 244, 0.1);
  }
  
  .activity-icon.store-updated {
    background: rgba(156, 39, 176, 0.1);
  }
  
  .activity-icon.system-updated {
    background: rgba(255, 152, 0, 0.1);
  }
  
  .activity-icon.report-generated {
    background: rgba(233, 30, 99, 0.1);
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
  
  .system-overview {
    margin-top: 20px;
  }
  
  .system-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .system-stat-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .system-stat-label {
    font-size: 0.9rem;
    color: #6b4f35;
    opacity: 0.7;
  }
  
  .system-stat-bar {
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .system-stat-progress {
    height: 100%;
    background: #7a5d3a;
    border-radius: 4px;
  }
  
  .system-stat-value {
    font-size: 0.9rem;
    color: #6b4f35;
    font-weight: bold;
    text-align: right;
  }
  
  .system-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .system-info-item {
    padding: 15px;
    background: #f9f6f2;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .system-info-label {
    font-size: 0.85rem;
    color: #6b4f35;
    opacity: 0.7;
  }
  
  .system-info-value {
    font-size: 1rem;
    color: #6b4f35;
    font-weight: bold;
  }
  
  .system-info-value.online {
    color: #388e3c;
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
  
  /* Store Management Tab Styles */
  .stores-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .store-card {
    background: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
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
  
  /* Analytics Tab Styles */
  .date-range-picker {
    display: flex;
  }
  
  .date-range-select {
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    background-color: white;
  }
  
  .analytics-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .chart-panel {
    height: 300px;
  }
  
  .chart-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(122, 93, 58, 0.05);
    border-radius: 8px;
  }
  
  .chart-message {
    color: #7a5d3a;
    font-weight: bold;
    margin-bottom: 20px;
  }
  
  .mock-chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    width: 80%;
    height: 60%;
  }
  
  .mock-bar {
    width: 30px;
    background: #7a5d3a;
    border-radius: 4px 4px 0 0;
  }
  
  .mock-pie-chart {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    position: relative;
    overflow: hidden;
  }
  
  .pie-segment {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  
  .segment1 {
    background: #7a5d3a;
    clip-path: polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 50%);
  }
  
  .segment2 {
    background: #a57e4e;
    clip-path: polygon(50% 50%, 0 0, 100% 0);
  }
  
  .segment3 {
    background: #c4a98b;
    clip-path: polygon(50% 50%, 0 0, 0 50%);
  }
  
  .segment4 {
    background: #e0c9a7;
    clip-path: polygon(50% 50%, 100% 50%, 100% 0, 50% 0);
  }
  
  .trend-indicator {
    font-weight: bold;
    padding: 2px 5px;
    border-radius: 3px;
    display: inline-block;
  }
  
  .trend-indicator.positive {
    background: rgba(56, 142, 60, 0.1);
    color: #388e3c;
  }
  
  .trend-indicator.negative {
    background: rgba(244, 67, 54, 0.1);
    color: #d32f2f;
  }
  
  /* Settings Tab Styles */
  .settings-panels {
    display: grid;
    grid-template-columns: 1fr;
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
    top: 0
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
  
  @media (max-width: 1024px) {
    .dashboard-panels {
      grid-template-columns: 1fr;
    }
    
    .system-stats, .system-info {
      grid-template-columns: 1fr 1fr;
    }
    
    .analytics-charts {
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
    
    .system-stats, .system-info {
      grid-template-columns: 1fr;
    }
    
    .stores-grid {
      grid-template-columns: 1fr;
    }
  }
`}</style>
</div>
</>
);
}