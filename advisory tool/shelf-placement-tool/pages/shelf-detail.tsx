import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import axios from "axios";

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

interface ShelfData {
  id: string;
  name: string;
  location: string;
  userId: string;
  userName: string;
  createdAt: string;
  products: Product[];
}

export default function ShelfDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [shelf, setShelf] = useState<ShelfData | null>(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // The grid size is fixed at 5x5
  const gridSize = 5;
  const rowLabels = ['A', 'B', 'C', 'D', 'E'];
  const colLabels = ['1', '2', '3', '4', '5'];
  
  // Available products to add to the shelf
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  
  // Currently selected product to place on the grid
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Keep track of which slots have products
  const [grid, setGrid] = useState<Array<Product | null>>(Array(gridSize * gridSize).fill(null));
  
  // New state variables for API recommendations
  const [recommendedPositions, setRecommendedPositions] = useState<string[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

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
      
      // Load shelf data if ID is available
      if (id) {
        loadShelfData(id as string);
        // Load available products
        loadProducts();
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/user-login");
    } finally {
      setLoading(false);
    }
  }, [router, id]);
  
  const loadShelfData = (shelfId: string) => {
    try {
      const shelves = JSON.parse(localStorage.getItem("shelves") || "[]");
      const foundShelf = shelves.find((s: ShelfData) => s.id === shelfId);
      
      if (!foundShelf) {
        setError("Shelf not found");
        return;
      }

      setShelf(foundShelf);
      
      // Initialize grid with shelf products
      const initialGrid = Array(gridSize * gridSize).fill(null);
      foundShelf.products.forEach(product => {
        if (product.slot !== undefined && product.slot < initialGrid.length) {
          initialGrid[product.slot] = product;
        }
      });
      
      setGrid(initialGrid);
    } catch (error) {
      console.error("Error loading shelf data:", error);
      setError("Failed to load shelf data");
    }
  };
    
  const loadProducts = () => {
    try {
      const storedProducts = JSON.parse(localStorage.getItem("products") || "[]");
      setAvailableProducts(storedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      setAvailableProducts([]);
    }
  };
  
  // New function to fetch recommended positions from the API
  const fetchRecommendedPositions = async (productName: string) => {
    setIsLoadingRecommendations(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/', {
        product_name: productName
      });
      
      if (response.data && response.data.selected_positions) {
        setRecommendedPositions(response.data.selected_positions);
        console.log("Recommended positions:", response.data.selected_positions);
      }
    } catch (error) {
      console.error("Error fetching position recommendations:", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };
    
  const handleProductSelect = (productId: string) => {
    if (!isEditing) return;
    
    const product = availableProducts.find(p => p.id === productId);
    setSelectedProduct(product || null);
    
    // If a product is selected, fetch position recommendations
    if (product) {
      fetchRecommendedPositions(product.name);
    } else {
      setRecommendedPositions([]);
    }
  };
  
  const getPositionLabel = (index: number) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    return `${rowLabels[row]}${colLabels[col]}`;
  };
    
  const handleGridCellClick = (index: number) => {
    if (!isEditing) return;
    
    if (!selectedProduct) {
      // If no product is selected, check if there's a product in this cell to remove
      if (grid[index]) {
        // Remove product from this cell
        const newGrid = [...grid];
        newGrid[index] = null;
        setGrid(newGrid);
      }
      return;
    }
    
    // Check if this cell is already occupied
    if (grid[index]) {
      setError("This cell is already occupied. Remove the product first.");
      return;
    }
    
    // Place the selected product on the grid
    const newGrid = [...grid];
    const position = getPositionLabel(index);
    newGrid[index] = { ...selectedProduct, slot: index, position: position };
    setGrid(newGrid);
    
    // Clear selected product
    setSelectedProduct(null);
    // Clear recommended positions
    setRecommendedPositions([]);
  };
    
  const handleRemoveProduct = (index: number) => {
    if (!isEditing) return;
    
    const newGrid = [...grid];
    newGrid[index] = null;
    setGrid(newGrid);
  };
    
  const handleShelfInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!shelf || !isEditing) return;
    
    const { name, value } = e.target;
    setShelf({ ...shelf, [name]: value });
  };
    
  const handleSave = () => {
    if (!shelf) return;
    
    try {
      // Create updated shelf data with placed products
      const productsInShelf = grid
        .filter(cell => cell !== null)
        .map(product => ({
          ...product
        }));
      
      const updatedShelf = {
        ...shelf,
        products: productsInShelf
      };
      
      // Update in localStorage
      const shelves = JSON.parse(localStorage.getItem("shelves") || "[]");
      const updatedShelves = shelves.map((s: ShelfData) => 
        s.id === shelf.id ? updatedShelf : s
      );
      
      localStorage.setItem("shelves", JSON.stringify(updatedShelves));
      
      // Exit edit mode
      setIsEditing(false);
      setError("");
    } catch (error) {
      console.error("Error saving shelf:", error);
      setError("Failed to save changes. Please try again.");
    }
  };
    
  const handleDelete = () => {
    if (!shelf) return;
    
    try {
      // Remove from localStorage
      const shelves = JSON.parse(localStorage.getItem("shelves") || "[]");
      const updatedShelves = shelves.filter((s: ShelfData) => s.id !== shelf.id);
      
      localStorage.setItem("shelves", JSON.stringify(updatedShelves));
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting shelf:", error);
      setError("Failed to delete shelf. Please try again.");
    } finally {
      setShowDeleteModal(false);
    }
  };
    
  const handleAddProduct = () => {
    // Store shelf ID in localStorage for the product entry page
    localStorage.setItem("currentShelfId", shelf?.id || "");
    router.push("/product-entry");
  };
    
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading shelf data...</p>
        
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
  
  if (error === "Shelf not found") {
    return (
      <div className="error-container">
        <h1>Shelf Not Found</h1>
        <p>The shelf you are looking for does not exist or has been deleted.</p>
        <button onClick={() => router.push("/dashboard")} className="back-button">
          Back to Dashboard
        </button>
        
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: 'Poppins', sans-serif;
            color: #6b4f35;
            background: #f9f6f2;
            text-align: center;
            padding: 20px;
          }
          .back-button {
            background: #8b6f47;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>{shelf?.name || "Shelf Detail"}</title>
      </Head>
      
      <div className="shelf-detail-container">
        <header className="page-header">
          <div className="header-title">
            <button onClick={() => router.push("/dashboard")} className="back-button">
              ← Back
            </button>
            <h1>{isEditing ? "Edit Shelf" : (shelf?.name || "Shelf Detail")}</h1>
          </div>
          <div className="header-actions">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="cancel-button">Cancel</button>
                <button onClick={handleSave} className="save-button">Save Changes</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="edit-button">Edit Shelf</button>
                <button onClick={() => setShowDeleteModal(true)} className="delete-button">Delete</button>
              </>
            )}
          </div>
        </header>
        
        {error && error !== "Shelf not found" && (
          <div className="error-message">
            {error}
            <button className="close-error" onClick={() => setError("")}>×</button>
          </div>
        )}
        
        <div className="shelf-detail-layout">
          <div className="shelf-info-panel">
            <div className="panel">
              <h2>Shelf Information</h2>
              <div className="form-group">
                <label htmlFor="name">Shelf Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={shelf?.name || ""} 
                    onChange={handleShelfInfoChange} 
                    placeholder="Enter shelf name" 
                  />
                ) : (
                  <div className="info-value">{shelf?.name}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    id="location" 
                    name="location" 
                    value={shelf?.location || ""} 
                    onChange={handleShelfInfoChange} 
                    placeholder="Enter shelf location" 
                  />
                ) : (
                  <div className="info-value">{shelf?.location}</div>
                )}
              </div>
              <div className="form-group">
                <label>Created By</label>
                <div className="info-value">{shelf?.userName}</div>
              </div>
              <div className="form-group">
                <label>Created On</label>
                <div className="info-value">{new Date(shelf?.createdAt || "").toLocaleDateString()}</div>
              </div>
              <div className="form-group">
                <label>Grid Size</label>
                <div className="grid-size-display">5 × 5 (Fixed)</div>
              </div>
              <div className="shelf-stats">
                <div className="stat">
                  <span className="stat-label">Products Placed:</span>
                  <span className="stat-value">{grid.filter(cell => cell !== null).length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Empty Slots:</span>
                  <span className="stat-value">{grid.filter(cell => cell === null).length}</span>
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="panel">
                <h2>Available Products</h2>
                <div className="panel-actions">
                  <button onClick={handleAddProduct} className="add-product-button">
                    + Add New Product
                  </button>
                </div>
                
                {availableProducts.length === 0 ? (
                  <div className="no-products">
                    <p>No products available</p>
                  </div>
                ) : (
                  <div className="products-list">
                    {availableProducts.map(product => (
                      <div 
                        key={product.id} 
                        className={`product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                        onClick={() => handleProductSelect(product.id)}
                      >
                        <h3>{product.name}</h3>
                        <div className="product-details">
                          <span className="product-category">{product.category}</span>
                          <span className="product-price">${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</span>
                        </div>
                        <div className="product-details">
                          <span className="product-size">{product.size}</span>
                          <span className={`product-demand ${product.demand?.toLowerCase()}-demand`}>{product.demand}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedProduct && (
                  <div className="selected-product-info">
                    <h3>Selected Product</h3>
                    <p>{selectedProduct.name}</p>
                    <p className="help-text">Click on the grid to place this product</p>
                    <button 
                      onClick={() => {
                        setSelectedProduct(null);
                        setRecommendedPositions([]);
                      }} 
                      className="cancel-selection-button"
                    >
                      Cancel Selection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="grid-panel">
            <div className="panel">
              <h2>Shelf Grid (5×5)</h2>
              {isEditing && (
                <p className="help-text">
                  {selectedProduct 
                    ? 'Click on a cell to place the selected product' 
                    : 'Select a product from the list to place on the grid. Click on a product in the grid to remove it.'}
                </p>
              )}
              
              <div className="grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                {Array(gridSize * gridSize).fill(null).map((_, index) => {
                  const product = grid[index];
                  const position = getPositionLabel(index);
                  return (
                    <div 
                      key={index}
                      className={`grid-cell ${product ? 'occupied' : ''} ${isEditing ? 'editable' : ''} ${
                        !product && selectedProduct && recommendedPositions.includes(position) ? 'recommended-slot' : ''
                      }`}
                      onClick={() => handleGridCellClick(index)}
                    >
                        {product && (
                          <div className="grid-product">
                            <div className="product-name">{product.name}</div>
                            <div className="product-price">${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</div>
                            {isEditing && (
                              <button 
                                className="remove-product"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveProduct(index);
                                }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Delete Shelf?</h2>
                <p>Are you sure you want to delete this shelf? This action cannot be undone.</p>
                <div className="modal-actions">
                  <button onClick={() => setShowDeleteModal(false)} className="cancel-button">
                    Cancel
                  </button>
                  <button onClick={handleDelete} className="delete-confirm-button">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <style jsx>{`
            .shelf-detail-container {
              font-family: 'Poppins', sans-serif;
              background-color: #f9f6f2;
              min-height: 100vh;
              padding: 30px;
            }
            
            .page-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
            }
            
            .header-title {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            
            .back-button {
              background: rgba(139, 111, 71, 0.1);
              color: #6b4f35;
              border: none;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2rem;
              cursor: pointer;
              transition: background 0.3s;
            }
            
            .back-button:hover {
              background: rgba(139, 111, 71, 0.2);
            }
            
            .page-header h1 {
              color: #6b4f35;
              margin: 0;
              font-size: 2rem;
            }
            
            .header-actions {
              display: flex;
              gap: 15px;
            }
            
            .cancel-button, .edit-button {
              background: #e7e2d8;
              color: #6b4f35;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
              transition: background 0.3s;
            }
            
            .cancel-button:hover, .edit-button:hover {
              background: #d9d0c3;
            }
            
            .save-button {
              background: #8b6f47;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
              transition: background 0.3s;
            }
            
            .save-button:hover {
              background: #7a5d3a;
            }
            
            .delete-button {
              background: #ffebee;
              color: #c62828;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
              transition: background 0.3s;
            }
            
            .delete-button:hover {
              background: #ffcdd2;
            }
            
            .error-message {
              background-color: #ffebee;
              color: #c62828;
              padding: 12px 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .close-error {
              background: none;
              border: none;
              color: #c62828;
              font-size: 1.2rem;
              cursor: pointer;
              padding: 0;
              margin-left: 10px;
            }
            
            .shelf-detail-layout {
              display: grid;
              grid-template-columns: 350px 1fr;
              gap: 30px;
            }
            
            .panel {
              background: white;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            
            .panel h2 {
              color: #6b4f35;
              margin-top: 0;
              margin-bottom: 20px;
              font-size: 1.3rem;
            }
            
            .form-group {
              margin-bottom: 20px;
            }
            
            .form-group label {
              display: block;
              margin-bottom: 8px;
              color: #6b4f35;
              font-weight: bold;
              font-size: 0.9rem;
            }
            
            .form-group input {
              width: 100%;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 5px;
              font-size: 1rem;
            }
            
            .form-group input:focus {
              outline: none;
              border-color: #8b6f47;
              box-shadow: 0 0 0 2px rgba(139, 111, 71, 0.1);
            }
            
            .info-value {
              padding: 10px;
              background: #f8f4ef;
              border-radius: 5px;
              color: #6b4f35;
            }
            
            .grid-size-display {
              padding: 10px;
              background: #f0e6d9;
              border-radius: 5px;
              color: #6b4f35;
              text-align: center;
              font-weight: bold;
            }
            
            .shelf-stats {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            
            .stat {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 5px;
            }
            
            .stat-label {
              color: #6b4f35;
              font-size: 0.85rem;
            }
            
            .stat-value {
              color: #6b4f35;
              font-weight: bold;
              font-size: 1.2rem;
            }
            
            .panel-actions {
              margin-bottom: 15px;
            }
            
            .add-product-button {
              background: #8b6f47;
              color: white;
              border: none;
              padding: 8px 15px;
              border-radius: 5px;
              font-size: 0.9rem;
              cursor: pointer;
              transition: background 0.3s;
            }
            
            .add-product-button:hover {
              background: #7a5d3a;
            }
            
            .help-text {
              color: #7d6450;
              font-size: 0.9rem;
              margin-bottom: 15px;
            }
            
            .products-list {
              max-height: 300px;
              overflow-y: auto;
              margin-bottom: 15px;
            }
            
            .no-products {
              text-align: center;
              padding: 20px;
              color: #7d6450;
            }
            
            .product-item {
              background: #f8f4ef;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 10px;
              cursor: pointer;
              transition: background 0.2s;
              border: 2px solid transparent;
            }
            
            .product-item:hover {
              background: #f0e6d9;
            }
            
            .product-item.selected {
              border-color: #8b6f47;
              background: #f0e6d9;
            }
            
            .product-item h3 {
              margin: 0 0 8px;
              font-size: 1rem;
              color: #6b4f35;
            }
            
            .product-details {
              display: flex;
              justify-content: space-between;
              font-size: 0.85rem;
              margin-top: 5px;
            }
            
            .product-category {
              background: rgba(107, 79, 53, 0.1);
              color: #6b4f35;
              padding: 2px 6px;
              border-radius: 10px;
            }
            
            .product-size, .product-price {
              color: #6b4f35;
            }
            
            .high-demand {
              background: rgba(56, 142, 60, 0.1);
              color: #388e3c;
              padding: 2px 6px;
              border-radius: 10px;
            }
            
            .medium-demand {
              background: rgba(245, 124, 0, 0.1);
              color: #f57c00;
              padding: 2px 6px;
              border-radius: 10px;
            }
            
            .low-demand {
              background: rgba(117, 117, 117, 0.1);
              color: #757575;
              padding: 2px 6px;
              border-radius: 10px;
            }
            
            .selected-product-info {
              background: #f0e6d9;
              padding: 12px;
              border-radius: 8px;
              margin-top: 15px;
            }
            
            .selected-product-info h3 {
              margin: 0 0 5px;
              font-size: 1rem;
              color: #6b4f35;
            }
            
            .selected-product-info p {
              margin: 5px 0;
              font-size: 0.9rem;
              color: #7d6450;
            }
            
            .cancel-selection-button {
              background: rgba(107, 79, 53, 0.1);
              color: #6b4f35;
              border: none;
              padding: 5px 10px;
              border-radius: 5px;
              font-size: 0.85rem;
              cursor: pointer;
              margin-top: 5px;
            }
            
            .grid {
              display: grid;
              gap: 8px;
              background: #f8f4ef;
              padding: 15px;
              border-radius: 8px;
            }
            
            .grid-cell {
              background: #f0e6d9;
              border-radius: 5px;
              aspect-ratio: 1/1;
              min-height: 70px;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            }
            
            .grid-cell.editable {
              cursor: pointer;
              transition: transform 0.2s;
            }
            
            .grid-cell.editable:hover {
              transform: scale(1.05);
            }
            
            .grid-cell.occupied {
              background: #e0c9a7;
            }

            .grid-cell.recommended-slot {
            background: #9cbfa7;
             border: 2px dashed #5b8c6e;
             box-shadow: 0 0 5px rgba(91, 140, 110, 0.5);
             animation: pulse 2s infinite;
            }

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}
            
            .grid-product {
              text-align: center;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 5px;
            }
            
            .product-name {
              font-weight: bold;
              font-size: 0.85rem;
              margin-bottom: 5px;
              color: #6b4f35;
              max-width: 90%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            
            .remove-product {
              position: absolute;
              top: 5px;
              right: 5px;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: rgba(0, 0, 0, 0.1);
              border: none;
              color: #6b4f35;
              font-size: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            }
            
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
            
            .modal-content h2 {
              color: #6b4f35;
              margin-top: 0;
              margin-bottom: 10px;
            }
            
            .modal-content p {
              color: #7d6450;
              margin-bottom: 20px;
            }
            
            .modal-actions {
              display: flex;
              justify-content: flex-end;
              gap: 10px;
            }
            
            .delete-confirm-button {
              background: #c62828;
              color: white;
              border: none;
              padding: 10px 15px;
              border-radius: 5px;
              font-weight: bold;
              cursor: pointer;
            }
            
            @media (max-width: 1024px) {
              .shelf-detail-layout {
                grid-template-columns: 1fr;
              }
              
              .shelf-info-panel {
                order: 1;
              }
              
              .grid-panel {
                order: 0;
              }
            }
            
            @media (max-width: 768px) {
              .shelf-detail-container {
                padding: 15px;
              }
              
              .page-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
              }
              
              .header-actions {
                width: 100%;
                justify-content: space-between;
              }
              
              .grid-cell {
                min-height: 60px;
              }
            }
          `}</style>
        </div>
      </>
    );
  }