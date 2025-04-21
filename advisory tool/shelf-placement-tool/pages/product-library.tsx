import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Define types
interface Product {
  id: string;
  name: string;
  category: string;
  price: number | string;
  margin: number | string;
  size: string;
  buyingDecision: string;
  demand: string;
  createdAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  isVerified?: boolean;
}

export default function ProductLibrary() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Google Apps Script web app URL
  const API_URL = "https://script.google.com/macros/s/AKfycby3_qfj9512USbRiYqAkYf6191xrsAAmDu36qizGtAsI2HE6F6vd6KJCPAqvtAXRMQv/exec";

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/user-login");
      return;
    }
    
    const parsedUserData = JSON.parse(userData);
    
    // Check if user's email is verified
    if (!parsedUserData.isVerified) {
      router.push("/verify-email");
      return;
    }
    
    setUser(parsedUserData);
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Try to fetch products from the API first
      try {
        const response = await fetch(`${API_URL}?action=getProducts`);
        const data = await response.json();
        
        if (data && data.length > 1) { // Skip header row
          // Transform API data format to match our interface
          const apiProducts = data.slice(1).map((item: any, index: number) => ({
            id: `api_product_${index}`,
            name: item[0] || '',
            category: item[1] || '',
            price: item[2] || 0,
            margin: item[3] || 0,
            size: item[4] || '',
            buyingDecision: item[5] || '',
            demand: item[6] || '',
            createdAt: new Date().toISOString().split('T')[0]
          }));
          
          setProducts(apiProducts);
          // Also store in localStorage
          localStorage.setItem("products", JSON.stringify(apiProducts));
          return;
        }
      } catch (error) {
        console.error("Error fetching products from API:", error);
        // Continue with localStorage fallback
      }
      
      // Retrieve products from localStorage as fallback
      const storedProducts = localStorage.getItem("products");
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        // Initialize with empty array if no products exist
        setProducts([]);
        localStorage.setItem("products", JSON.stringify([]));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewProduct = () => {
    // Remove any shelf context for new product
    localStorage.removeItem("currentShelfId");
    localStorage.removeItem("editProductId");
    router.push("/product-entry");
  };

  const handleEditProduct = (product: Product) => {
    // Store product ID for the product entry page
    localStorage.setItem("editProductId", product.id);
    localStorage.removeItem("currentShelfId");
    router.push("/product-entry");
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = () => {
    if (!selectedProduct) return;
    
    try {
      // Remove product from storage
      const updatedProducts = products.filter(p => p.id !== selectedProduct.id);
      setProducts(updatedProducts);
      localStorage.setItem("products", JSON.stringify(updatedProducts));
      
      // Also remove from any shelves
      const shelves = JSON.parse(localStorage.getItem("shelves") || "[]");
      const updatedShelves = shelves.map((shelf: any) => ({
        ...shelf,
        products: shelf.products.filter((p: Product) => p.id !== selectedProduct.id)
      }));
      localStorage.setItem("shelves", JSON.stringify(updatedShelves));
      
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: {[key: string]: string} = {
      fashion: "#e91e63",
      food: "#ff9800",
      health: "#4caf50",
      beauty: "#9c27b0",
      home: "#2196f3",
      sports: "#f44336",
      travel: "#009688",
      default: "#757575"
    };
    
    return colors[category] || colors.default;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/user-login");
  };

  const uniqueCategories = [...new Set(products.map(product => product.category))].filter(Boolean);

  return (
    <div className="product-library-container">
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
              <li><a href="/dashboard">My Shelves</a></li>
              <li className="active"><a href="/product-library">Product Library</a></li>
              <li><a href="/store-insights">Store Insights</a></li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="main-content">
          <div className="page-title">
            <h2>Product Library</h2>
            <button 
              onClick={handleAddNewProduct} 
              className="add-product-button"
            >
              + Add New Product
            </button>
          </div>

          {/* Search and filter */}
          <div className="filter-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
            <div className="category-filter">
              <select 
                value={selectedCategory} 
                onChange={handleCategoryFilter}
                className="category-select"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <img src="/empty-products.png" alt="No products" className="empty-icon" />
              <h3>No products added yet</h3>
              <p>Add your first product to start optimizing shelf placement</p>
              <button 
                onClick={handleAddNewProduct}
                className="create-first-button"
              >
                Add Your First Product
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-results">
              <p>No products match your search criteria</p>
            </div>
          ) : (
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Margin %</th>
                    <th>Size</th>
                    <th>Buying Decision</th>
                    <th>Demand</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        <span 
                          className="category-badge" 
                          style={{ backgroundColor: getCategoryColor(product.category) }}
                        >
                          {product.category}
                        </span>
                      </td>
                      <td>₹{product.price}</td>
                      <td>{product.margin}%</td>
                      <td>{product.size}</td>
                      <td>{product.buyingDecision}</td>
                      <td>{product.demand}</td>
                      <td className="action-buttons">
                        <button 
                          onClick={() => handleEditProduct(product)} 
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product)} 
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete <strong>{selectedProduct.name}</strong>?</p>
            <p className="warning">This will also remove the product from any shelves it's placed on.</p>
            
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="cancel-button">Cancel</button>
              <button onClick={confirmDeleteProduct} className="delete-confirm-button">Delete</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Main container layout */
        .product-library-container {
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

        .add-product-button {
          background: #8b6f47;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .add-product-button:hover {
          background: #7a5d3a;
        }

        /* Filter section */
        .filter-section {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .search-box {
          flex: 1;
        }

        .search-input {
          width: 100%;
          padding: 10px 15px;
          border: 2px solid #e0c9a7;
          border-radius: 6px;
          font-size: 16px;
          background: #fff;
          transition: border-color 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #8b6f47;
        }

        .category-filter {
          width: 200px;
        }

        .category-select {
          width: 100%;
          padding: 10px 15px;
          border: 2px solid #e0c9a7;
          border-radius: 6px;
          font-size: 16px;
          background: #fff;
          transition: border-color 0.3s ease;
        }

        .category-select:focus {
          outline: none;
          border-color: #8b6f47;
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

        /* No results */
        .no-results {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          color: #8d8d8d;
          font-size: 1.2rem;
        }

        /* Products table */
        .products-table {
          overflow-x: auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f0e6d9;
          color: #6b4f35;
          text-align: left;
          padding: 15px;
          font-weight: 600;
          position: sticky;
          top: 0;
        }

        td {
          padding: 15px;
          border-bottom: 1px solid #f0e6d9;
          color: #6b4f35;
        }

        tr:last-child td {
          border-bottom: none;
        }

        tr:hover {
          background: #fbf7f2;
        }

        .category-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-buttons button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.3s ease;
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
          margin-bottom: 15px;
        }

        .modal-content p {
          color: #6b4f35;
          margin-bottom: 10px;
        }

        .warning {
          color: #c06b6b;
          font-size: 0.9rem;
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

        .delete-confirm-button {
          background: #d32f2f;
          color: white;
        }

        .delete-confirm-button:hover {
          background: #b71c1c;
        }
      `}</style>
    </div>
  );
}