import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/user-login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Check if user is verified
    if (!parsedUser.isVerified) {
      router.push("/verify-email");
      return;
    }
    
    setUser(parsedUser);
    setLoading(false);
  }, [router]);

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
                <a href="#">Products</a>
              </li>
              <li>
                <a href="#">Store Layout</a>
              </li>
              <li>
                <a href="#">Analytics</a>
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
              <h3>Products</h3>
              <div className="stat-value">245</div>
              <p>↑ 12% from last month</p>
            </div>
            <div className="stat-card">
              <h3>Revenue</h3>
              <div className="stat-value">$15,245</div>
              <p>↑ 8% from last month</p>
            </div>
            <div className="stat-card">
              <h3>Profit</h3>
              <div className="stat-value">$5,432</div>
              <p>↑ 5% from last month</p>
            </div>
            <div className="stat-card">
              <h3>Customer Traffic</h3>
              <div className="stat-value">2,450</div>
              <p>↑ 18% from last month</p>
            </div>
          </div>
          
          <div className="dashboard-panels">
            <div className="panel">
              <h3>Recent Products</h3>
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
                  <tr>
                    <td>Colgate Toothpaste</td>
                    <td>Health</td>
                    <td>$3.22</td>
                    <td><span className="high-demand">High</span></td>
                  </tr>
                  <tr>
                    <td>Nike T-Shirt</td>
                    <td>Fashion</td>
                    <td>$54.00</td>
                    <td><span className="high-demand">High</span></td>
                  </tr>
                  <tr>
                    <td>Adidas Shoes</td>
                    <td>Fashion</td>
                    <td>$54.00</td>
                    <td><span className="high-demand">High</span></td>
                  </tr>
                  <tr>
                    <td>Tennis Racket</td>
                    <td>Sports</td>
                    <td>$34.00</td>
                    <td><span className="high-demand">High</span></td>
                  </tr>
                  <tr>
                    <td>Chocolate Bar</td>
                    <td>Food</td>
                    <td>$8.00</td>
                    <td><span className="high-demand">High</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="panel">
              <h3>Top Performing Stores</h3>
              <div className="store-list">
                <div className="store-item">
                  <div className="store-info">
                    <h4>Store D</h4>
                    <p>Sales: $6,000</p>
                  </div>
                  <div className="store-progress">
                    <div className="progress-bar" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="store-item">
                  <div className="store-info">
                    <h4>Store A</h4>
                    <p>Sales: $5,000</p>
                  </div>
                  <div className="store-progress">
                    <div className="progress-bar" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div className="store-item">
                  <div className="store-info">
                    <h4>Store E</h4>
                    <p>Sales: $4,000</p>
                  </div>
                  <div className="store-progress">
                    <div className="progress-bar" style={{ width: '55%' }}></div>
                  </div>
                </div>
                <div className="store-item">
                  <div className="store-info">
                    <h4>Store B</h4>
                    <p>Sales: $3,500</p>
                  </div>
                  <div className="store-progress">
                    <div className="progress-bar" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="store-item">
                  <div className="store-info">
                    <h4>Store C</h4>
                    <p>Sales: $2,000</p>
                  </div>
                  <div className="store-progress">
                    <div className="progress-bar" style={{ width: '30%' }}></div>
                  </div>
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
          
          .store-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .store-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .store-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .store-info h4 {
            margin: 0;
            color: #6b4f35;
            font-size: 1rem;
          }
          
          .store-info p {
            margin: 0;
            color: #6b4f35;
            opacity: 0.7;
            font-size: 0.9rem;
          }
          
          .store-progress {
            width: 100%;
            height: 8px;
            background: #f0f0f0;
            border-radius: 4px;
            overflow: hidden;
          }
          
          .progress-bar {
            height: 100%;
            background: #8b6f47;
            border-radius: 4px;
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
          }
        `}</style>
      </div>
    </>
  );
}