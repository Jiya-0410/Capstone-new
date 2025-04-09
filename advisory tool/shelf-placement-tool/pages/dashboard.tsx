import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Define types
interface User {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  margin: number;
  size: string;
  buyingDecision: string;
  demand: string;
  slot?: number;
}

interface Shelf {
  id: string;
  name: string;
  rows: number;
  cols: number;
  created: string;
  products: Product[];
}

interface NewShelfData {
  name: string;
  rows: number;
  cols: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddShelfModal, setShowAddShelfModal] = useState<boolean>(false);
  const [newShelfData, setNewShelfData] = useState<NewShelfData>({ name: "", rows: 3, cols: 3 });
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [showEditShelfModal, setShowEditShelfModal] = useState<boolean>(false);

  // Google Apps Script web app URL
  const API_URL = "https://script.google.com/macros/s/AKfycby3_qfj9512USbRiYqAkYf6191xrsAAmDu36qizGtAsI2HE6F6vd6KJCPAqvtAXRMQv/exec";

//   useEffect(() => {
//     // Check if user is logged in
//     const userData = localStorage.getItem("user");
//     if (!userData) {
//       router.push("/user-login");
//       return;
//     }
    
//     setUser(JSON.parse(userData));
//     fetchShelves();
//   }, []);

  const fetchShelves = async () => {
    setLoading(true);
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return;
      
      // Retrieve shelves from localStorage
      const storedShelves = localStorage.getItem("shelves");
      if (storedShelves) {
        setShelves(JSON.parse(storedShelves));
      } else {
        // Initialize with empty array if no shelves exist
        setShelves([]);
        localStorage.setItem("shelves", JSON.stringify([]));
      }
    } catch (error) {
      console.error("Error fetching shelves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewShelf = async () => {
    if (!newShelfData.name) {
      alert("Please enter a shelf name");
      return;
    }
    
    try {
      setLoading(true);
      // Create new shelf
      const newShelf: Shelf = {
        id: `shelf${Date.now()}`,
        name: newShelfData.name,
        rows: newShelfData.rows,
        cols: newShelfData.cols,
        created: new Date().toISOString().split('T')[0],
        products: []
      };
      
      const updatedShelves = [...shelves, newShelf];
      setShelves(updatedShelves);
      
      // Update localStorage
      localStorage.setItem("shelves", JSON.stringify(updatedShelves));
      
      setShowAddShelfModal(false);
      setNewShelfData({ name: "", rows: 3, cols: 3 });
    } catch (error) {
      console.error("Error creating shelf:", error);
      alert("Failed to create shelf. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShelf = async (shelfId: string) => {
    if (!confirm("Are you sure you want to delete this shelf?")) return;
    
    try {
      setLoading(true);
      const updatedShelves = shelves.filter(shelf => shelf.id !== shelfId);
      setShelves(updatedShelves);
      
      // Update localStorage
      localStorage.setItem("shelves", JSON.stringify(updatedShelves));
    } catch (error) {
      console.error("Error deleting shelf:", error);
      alert("Failed to delete shelf. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditShelf = (shelf: Shelf) => {
    setSelectedShelf({...shelf});
    setShowEditShelfModal(true);
  };

  const handleSaveShelfEdit = () => {
    if (!selectedShelf || !selectedShelf.name) {
      alert("Shelf name cannot be empty");
      return;
    }
    
    const updatedShelves = shelves.map(s => 
      s.id === selectedShelf.id ? selectedShelf : s
    );
    
    setShelves(updatedShelves);
    localStorage.setItem("shelves", JSON.stringify(updatedShelves));
    setShowEditShelfModal(false);
  };

  const handleViewShelf = (shelfId: string) => {
    // Navigate to shelf detail page
    router.push(`/shelf-detail?id=${shelfId}`);
  };

  const handleAddProduct = (shelfId: string) => {
    // Store the current shelf ID for the product entry page
    localStorage.setItem("currentShelfId", shelfId);
    router.push("/product-entry");
  };

  const handleGoToProductLibrary = () => {
    router.push("/product-library");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/user-login");
  };

  return (
    <div className="dashboard-container">
      {/* Header with user info */}
      <header className="dashboard-header">
        <div className="logo-section">
          <h1>Advisory Tool</h1>
        </div>
        <div className="user-section">
          <p>Welcome, {user?.name || "User"}!</p>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>

      {/* Main content area */}
      <div className="dashboard-content">
        {/* Sidebar navigation */}
        <aside className="sidebar">
          <nav>
            <ul>
              <li className="active"><a href="/dashboard">My Shelves</a></li>
              <li><a href="/product-library">Product Library</a></li>
              <li><a href="/analytics">Analytics</a></li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="main-content">
          <div className="page-title">
            <h2>My Shelves</h2>
            <button 
              onClick={() => setShowAddShelfModal(true)} 
              className="add-shelf-button"
            >
              + New Shelf
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading shelves...</div>
          ) : shelves.length === 0 ? (
            <div className="empty-state">
              <img src="/empty-shelf.png" alt="No shelves" className="empty-icon" />
              <h3>No shelves created yet</h3>
              <p>Create your first shelf to start optimizing product placement</p>
              <button 
                onClick={() => setShowAddShelfModal(true)}
                className="create-first-button"
              >
                Create Your First Shelf
              </button>
            </div>
          ) : (
            <div className="shelves-grid">
              {shelves.map((shelf) => (
                <div key={shelf.id} className="shelf-card">
                  <div className="shelf-header">
                    <h3>{shelf.name}</h3>
                    <span className="shelf-date">Created: {shelf.created}</span>
                  </div>
                  <div className="shelf-details">
                    <p>Size: {shelf.rows} x {shelf.cols}</p>
                    <p>Products: {shelf.products?.length || 0}</p>
                  </div>
                  <div className="shelf-preview">
                    {Array.from({ length: Math.min(6, shelf.rows * shelf.cols) }).map((_, index) => {
                      const product = shelf.products?.find(p => p.slot === index);
                      return (
                        <div 
                          key={index}
                          className={`preview-slot ${product ? 'filled' : 'empty'}`}
                          title={product?.name || 'Empty slot'}
                        >
                          {product && <span>{product.name.charAt(0)}</span>}
                        </div>
                      );
                    })}
                    {shelf.rows * shelf.cols > 6 && (
                      <div className="preview-more">+{shelf.rows * shelf.cols - 6} more</div>
                    )}
                  </div>
                  <div className="shelf-actions">
                    <button 
                      onClick={() => handleViewShelf(shelf.id)}
                      className="view-button"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleAddProduct(shelf.id)}
                      className="add-product-button"
                    >
                      Add Product
                    </button>
                    <button 
                      onClick={() => handleEditShelf(shelf)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteShelf(shelf.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add New Shelf Modal */}
      {showAddShelfModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Shelf</h3>
            <input
              type="text"
              placeholder="Shelf Name"
              value={newShelfData.name}
              onChange={(e) => setNewShelfData({...newShelfData, name: e.target.value})}
              className="input-field"
            />
            <div className="input-group">
              <label>Rows:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newShelfData.rows}
                onChange={(e) => setNewShelfData({...newShelfData, rows: parseInt(e.target.value)})}
                className="input-field small"
              />
            </div>
            <div className="input-group">
              <label>Columns:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newShelfData.cols}
                onChange={(e) => setNewShelfData({...newShelfData, cols: parseInt(e.target.value)})}
                className="input-field small"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddShelfModal(false)} className="cancel-button">Cancel</button>
              <button onClick={handleCreateNewShelf} className="create-button">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shelf Modal */}
      {showEditShelfModal && selectedShelf && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Shelf</h3>
            <input
              type="text"
              placeholder="Shelf Name"
              value={selectedShelf.name}
              onChange={(e) => setSelectedShelf({...selectedShelf, name: e.target.value})}
              className="input-field"
            />
            <div className="input-group">
              <label>Rows:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={selectedShelf.rows}
                onChange={(e) => setSelectedShelf({...selectedShelf, rows: parseInt(e.target.value)})}
                className="input-field small"
              />
            </div>
            <div className="input-group">
              <label>Columns:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={selectedShelf.cols}
                onChange={(e) => setSelectedShelf({...selectedShelf, cols: parseInt(e.target.value)})}
                className="input-field small"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditShelfModal(false)} className="cancel-button">Cancel</button>
              <button onClick={handleSaveShelfEdit} className="save-button">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Main dashboard layout */
        .dashboard-container {
          font-family: 'Poppins', sans-serif;
          background: #f9f6f2;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Header styling */
        .dashboard-header {
          background: #8b6f47;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .logo-section h1 {
          margin: 0;
          font-size: 1.8rem;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .user-section p {
          margin: 0;
        }

        .logout-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .logout-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Main content area with sidebar */
        .dashboard-content {
          display: flex;
          flex: 1;
          height: calc(100vh - 60px); /* Subtract header height */
        }

        /* Sidebar styling */
        .sidebar {
          width: 250px;
          background: #e0c9a7;
          padding: 30px 0;
          height: 100%;
        }

        .sidebar ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar li {
          margin-bottom: 5px;
        }

        .sidebar li a {
          display: block;
          padding: 12px 25px;
          color: #6b4f35;
          text-decoration: none;
          font-weight: 500;
          transition: background 0.3s ease;
        }

        .sidebar li:hover a {
          background: rgba(139, 111, 71, 0.1);
        }

        .sidebar li.active a {
          background: #8b6f47;
          color: white;
        }

        /* Main content styling */
        .main-content {
          flex: 1;
          padding: 30px;
          overflow-y: auto;
        }

        .page-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .page-title h2 {
          color: #6b4f35;
          margin: 0;
          font-size: 1.8rem;
        }

        .add-shelf-button {
          background: #8b6f47;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .add-shelf-button:hover {
          background: #7a5d3a;
        }

        /* Loading state */
        .loading {
          text-align: center;
          padding: 40px;
          color: #8b6f47;
          font-size: 1.2rem;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .empty-icon {
          width: 120px;
          height: 120px;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          color: #6b4f35;
          margin-bottom: 10px;
          font-size: 1.5rem;
        }

        .empty-state p {
          color: #8d8d8d;
          margin-bottom: 20px;
        }

        .create-first-button {
          background: #8b6f47;
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .create-first-button:hover {
          background: #7a5d3a;
        }

        /* Shelves grid */
        .shelves-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 25px;
        }

        .shelf-card {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .shelf-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .shelf-header {
          background: #e0c9a7;
          padding: 15px;
          color: #6b4f35;
        }

        .shelf-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }

        .shelf-date {
          font-size: 12px;
          opacity: 0.8;
        }

        .shelf-details {
          padding: 15px;
          border-bottom: 1px solid #f0e6d9;
        }

        .shelf-details p {
          margin: 5px 0;
          color: #6b4f35;
        }

        .shelf-preview {
          display: flex;
          flex-wrap: wrap;
          padding: 10px;
          gap: 5px;
          background: #f9f6f2;
        }

        .preview-slot {
          width: 40px;
          height: 40px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .preview-slot.empty {
          background: #f0e6d9;
        }

        .preview-slot.filled {
          background: #a07c5c;
          color: white;
        }

        .preview-more {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #8b6f47;
        }

        .shelf-actions {
          display: flex;
          padding: 15px;
          gap: 8px;
          flex-wrap: wrap;
        }

        .shelf-actions button {
          flex: 1;
          min-width: calc(50% - 4px);
          padding: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.3s ease;
        }

        .view-button {
          background: #8b6f47;
          color: white;
        }

        .view-button:hover {
          background: #7a5d3a;
        }

        .add-product-button {
          background: #5c8b47;
          color: white;
        }

        .add-product-button:hover {
          background: #4a7a3a;
        }

        .edit-button {
          background: #e7e2d8;
          color: #6b4f35;
        }

        .edit-button:hover {
          background: #d9d0c3;
        }

        .delete-button {
          background: #f8eee5;
          color: #c06b6b;
        }

        .delete-button:hover {
          background: #f0e1d5;
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 10px;
          padding: 25px;
          width: 400px;
          max-width: 90%;
        }

        .modal-content h3 {
          color: #6b4f35;
          margin-top: 0;
          margin-bottom: 20px;
        }

        .input-field {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border: 2px solid #e0c9a7;
          border-radius: 8px;
          margin-bottom: 15px;
          background: #f9f6f2;
        }

        .input-field:focus {
          outline: none;
          border-color: #8b6f47;
        }

        .input-field.small {
          width: 80px;
        }

        .input-group {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }

        .input-group label {
          width: 80px;
          color: #6b4f35;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .modal-actions button {
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
        }

        .cancel-button {
          background: #f1f1f1;
          color: #666;
        }

        .cancel-button:hover {
          background: #e5e5e5;
        }

        .create-button, .save-button {
          background: #8b6f47;
          color: white;
        }

        .create-button:hover, .save-button:hover {
          background: #7a5d3a;
        }
      `}</style>
    </div>
  );
}