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
  slot?: number;
}

export default function GridSelection() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [slottingFees, setSlottingFees] = useState<number[][]>([]);
  const [profitData, setProfitData] = useState<{maxProfit: number, bestSlot: number | null}>({
    maxProfit: 0,
    bestSlot: null
  });
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState({ x: 0, y: 0 });
  const [grid, setGrid] = useState<Array<Product | null>>([]);
  const [savingData, setSavingData] = useState(false);
  
  // Fixed grid size of 5x5
  const rows = 5;
  const cols = 5;
  
  // Row labels (A-E) and column labels (1-5)
  const rowLabels = ['A', 'B', 'C', 'D', 'E'];
  const colLabels = ['1', '2', '3', '4', '5'];

  // Store insights for tooltip display
  const storeInsights = [
    "Store A - High Sales, 80% Conversion",
    "Store B - Medium Sales, 60% Conversion",
    "Store C - Low Sales, 30% Conversion",
    "Store D - Best Performing",
    "Store E - Average Performance",
    "Store F - Needs Optimization",
  ];

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
      
      // Initialize the grid with the fixed size
      initializeGrid();
      
      // Fetch products and calculate slotting fees
      fetchProducts();
    } catch (error) {
      console.error("Error checking user data:", error);
      router.push("/user-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const initializeGrid = () => {
    // Initialize 5x5 grid with null values (empty slots)
    setGrid(Array(rows * cols).fill(null));
    
    // Generate slotting fees for each position
    generateSlottingFees();
  };

  const generateSlottingFees = () => {
    // Generate random slotting fees for each position in the grid
    // Higher fees for prime positions (middle and eye-level)
    const fees: number[][] = [];
    
    for (let i = 0; i < rows; i++) {
      const rowFees: number[] = [];
      for (let j = 0; j < cols; j++) {
        // Premium positions (middle of grid) have higher fees
        const distFromCenter = Math.abs(i - Math.floor(rows/2)) + Math.abs(j - Math.floor(cols/2));
        const baseFee = 20; // Base slotting fee
        const fee = Math.round(baseFee * (1 + (1 - distFromCenter/rows) * 0.5));
        rowFees.push(fee);
      }
      fees.push(rowFees);
    }
    
    setSlottingFees(fees);
  };

  const fetchProducts = async () => {
    try {
      // Try to get products from API first
      const scriptURL = "https://script.google.com/macros/s/AKfycbyOQraXDIXxTtPdZsSqw5zH50zh0-oAdOhgIakAK9HznoHsIqxMffA-nU88CYcfC1US/exec?action=getProducts";
      
      try {
        const response = await axios.get(scriptURL);
        // Log the structure of the response to understand its format
        console.log("API Response structure:", {
          isArray: Array.isArray(response.data),
          type: typeof response.data,
          keys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A',
          sample: response.data
        });
        
        // Try different ways to extract the data
        let productData = null;
        
        // Attempt #1: Direct array access
        if (Array.isArray(response.data)) {
          productData = response.data;
        } 
        // Attempt #2: Check for data in a nested property
        else if (response.data && typeof response.data === 'object') {
          // Common nested properties
          const possibleKeys = ['data', 'items', 'products', 'records', 'rows', 'values'];
          for (const key of possibleKeys) {
            if (response.data[key] && Array.isArray(response.data[key])) {
              productData = response.data[key];
              break;
            }
          }
          
          // Look for any array in the response if we haven't found one yet
          if (!productData) {
            for (const key in response.data) {
              if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
                productData = response.data[key];
                break;
              }
            }
          }
        }
        
        // If we found data, format and use it
        if (productData && Array.isArray(productData) && productData.length > 0) {
          const formattedProducts = productData.slice(0).map((item: any, index: number) => {
            // Handle both array items and object items
            if (Array.isArray(item)) {
              return {
                id: `api_product_${index}`,
                name: item[0] || 'Product',
                category: item[1] || 'General',
                price: parseFloat(item[2]) || 0,
                margin: parseFloat(item[3]) || 0,
                size: item[4] || 'Standard',
                buyingDecision: item[5] || 'Impulsive',
                demand: item[6] || 'Medium'
              };
            } else if (typeof item === 'object' && item !== null) {
              const keys = Object.keys(item);
              return {
                id: `api_product_${index}`,
                name: item.name || item.product_name || item[keys[0]] || 'Product',
                category: item.category || item[keys[1]] || 'General',
                price: parseFloat(item.price || item[keys[2]]) || 0,
                margin: parseFloat(item.margin || item[keys[3]]) || 0,
                size: item.size || item[keys[4]] || 'Standard',
                buyingDecision: item.buyingDecision || item[keys[5]] || 'Impulsive',
                demand: item.demand || item[keys[6]] || 'Medium'
              };
            }
            // Fallback for unexpected item format
            return {
              id: `api_product_${index}`,
              name: 'Product ' + (index + 1),
              category: 'General',
              price: 0,
              margin: 0,
              size: 'Standard',
              buyingDecision: 'Impulsive',
              demand: 'Medium'
            };
          });
          
          console.log("Formatted products:", formattedProducts);
          setProducts(formattedProducts);
          calculateBestSlots(formattedProducts);
          return;
        }
        
        // If we reach here, API data format wasn't usable
        console.warn("Couldn't extract product data from API response. Falling back to localStorage.");
        
      } catch (error) {
        console.error("Error fetching products from API:", error);
      }
      
      // Fallback to localStorage
      const storedProducts = localStorage.getItem("products");
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        setProducts(parsedProducts);
        calculateBestSlots(parsedProducts);
      } else {
        // If no products exist, use some default products
        const defaultProducts = [
          {
            id: "default_1",
            name: "Chocolate Bar",
            category: "Food",
            price: 3.99,
            margin: 0.35,
            size: "Small",
            buyingDecision: "Impulsive",
            demand: "High"
          },
          {
            id: "default_2",
            name: "Toothpaste",
            category: "Health",
            price: 4.99,
            margin: 0.25,
            size: "Medium",
            buyingDecision: "Essential",
            demand: "High"
          }
        ];
        
        setProducts(defaultProducts);
        calculateBestSlots(defaultProducts);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const calculateBestSlots = (productList: Product[]) => {
    if (!productList.length) return;
    
    // For each product, calculate optimal placement
    const product = productList[0]; // Using first product for demonstration
    let maxProfit = 0;
    let bestSlot = null;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const slotIndex = row * cols + col;
        const slottingFee = slottingFees[row]?.[col] || 20;
        
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        const margin = typeof product.margin === 'string' ? parseFloat(product.margin) : product.margin;
        
        const profit = price * margin - slottingFee;
        
        if (profit > maxProfit) {
          maxProfit = profit;
          bestSlot = slotIndex;
        }
      }
    }
    
    setProfitData({ maxProfit, bestSlot });
  };

  const handleProductSelection = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
  };

  const handleCellClick = (index: number) => {
    if (!selectedProduct) return;
    
    // Check if cell is already occupied
    if (grid[index] !== null) {
      alert("This slot is already occupied.");
      return;
    }
    
    // Place product in selected cell
    const newGrid = [...grid];
    newGrid[index] = {...selectedProduct, slot: index};
    setGrid(newGrid);
    
    // Clear selected product
    setSelectedProduct(null);
  };

  const handleRemoveProduct = (index: number) => {
    const newGrid = [...grid];
    newGrid[index] = null;
    setGrid(newGrid);
  };

  const handleMouseEnter = (index: number, event: React.MouseEvent) => {
    setHoveredSlot(index);
    setHoveredPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredSlot(null);
  };
  
  const getPositionLabel = (index: number) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return `${rowLabels[row]}${colLabels[col]}`;
  };

  const saveGrid = async () => {
    try {
      setSavingData(true);
      
      // Get filled slots with product info
      const filledSlots = grid
        .map((product, index) => product ? { ...product, slot: index, position: getPositionLabel(index) } : null)
        .filter(item => item !== null);
        
      // Create shelf object
      const shelfData = {
        shelfId: `shelf_${Date.now()}`,
        userId: user?.id || "",
        userEmail: user?.email || "",
        userName: user?.name || "User",
        location: "Main Store",
        createdAt: new Date().toISOString(),
        products: filledSlots,
        action: "saveShelf"  // This is important for the Google Apps Script to identify the action
      };
      
      // Save to localStorage
      const existingShelves = JSON.parse(localStorage.getItem("shelves") || "[]");
      localStorage.setItem("shelves", JSON.stringify([...existingShelves, shelfData]));
      
      // Send to Google Sheets
      try {
        const scriptURL = "https://script.google.com/macros/s/AKfycbym4j8lv0Fs-fsy9DLf9nAfPYpXbG8HMF6QGxTJ9ATps2FsgpyJkucuFEB6tKl_FXc/exec";
        
        // Send the data to Google Sheets
        const response = await axios.post(scriptURL, shelfData);
        
        if (response.data && response.data.success) {
          console.log("Grid data saved to Google Sheets successfully!");
        } else {
          console.warn("Warning: Saved to localStorage but may not have saved to Google Sheets:", response.data);
        }
      } catch (apiError) {
        console.error("Error saving to Google Sheets (saved to localStorage only):", apiError);
        // Still continue with local success since we saved to localStorage
      }
      
      // Give feedback and redirect
      alert("Shelf layout saved successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving grid:", error);
      alert("Error saving grid. Please try again.");
    } finally {
      setSavingData(false);
    }
  };

  const getSlottingFee = (index: number) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return slottingFees[row]?.[col] || 20;
  };

  if (loading || savingData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{savingData ? "Saving grid layout to Google Sheets..." : "Loading grid..."}</p>
        
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
        <title>Grid Selection - 5×5 Grid</title>
      </Head>
      
      <div className="container">
        <div className="heading-section">
          <h1>Optimize Your Shelf Space</h1>
          <p>Smart placement, maximum profit! (5×5 Grid)</p>
        </div>
        
        <div className="layout-container">
          <div className="left-panel">
            <div className="panel">
              <h2>Select Product</h2>
              {products.length === 0 ? (
                <div className="no-products">
                  <p>No products available.</p>
                  <button onClick={() => router.push("/product-entry")} className="add-button">
                    Add New Product
                  </button>
                </div>
              ) : (
                <div className="products-list">
                  {products.map(product => (
                    <div 
                      key={product.id} 
                      className={`product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                      onClick={() => handleProductSelection(product.id)}
                    >
                      <h3>{product.name}</h3>
                      <div className="product-details">
                        <span className="product-category">{product.category}</span>
                        <span className="product-price">
                          ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                        </span>
                      </div>
                      <div className="product-details">
                        <span className="product-margin">
                          Margin: {typeof product.margin === 'number' ? 
                            (product.margin * 100).toFixed(0) : product.margin}%
                        </span>
                        <span className={`product-demand ${product.demand?.toLowerCase()}-demand`}>
                          {product.demand}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedProduct && (
                <div className="selected-product-info">
                  <h3>Selected: {selectedProduct.name}</h3>
                  <p>Click on the grid to place this product.</p>
                </div>
              )}
              
              <div className="action-buttons">
                <button onClick={() => router.push("/dashboard")} className="cancel-button">
                  Cancel
                </button>
                <button 
                  onClick={saveGrid} 
                  className="save-button" 
                  disabled={grid.every(cell => cell === null)}
                >
                  Save Grid
                </button>
              </div>
            </div>
          </div>
          
          <div className="right-panel">
            <div className="panel">
              <h2>5×5 Grid Layout</h2>
              <p className="help-text">
                Select a product and click on the grid to place it. Cells with higher slotting fees are often in premium positions.
              </p>
              
              <div className="grid-container">
                {/* Column labels */}
                <div className="grid-labels column-labels">
                  <div className="label-spacer"></div>
                  {colLabels.map((label, idx) => (
                    <div key={idx} className="column-label">{label}</div>
                  ))}
                </div>
                
                <div className="grid-with-row-labels">
                  {/* Row labels */}
                  <div className="grid-labels row-labels">
                    {rowLabels.map((label, idx) => (
                      <div key={idx} className="row-label">{label}</div>
                    ))}
                  </div>
                  
                  {/* Main grid */}
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {Array(rows * cols).fill(null).map((_, idx) => {
                      const product = grid[idx];
                      const fee = getSlottingFee(idx);
                      const isBestSlot = idx === profitData.bestSlot;
                      const position = getPositionLabel(idx);
                      
                      return (
                        <div
                          key={idx}
                          className={`grid-cell ${product ? 'occupied' : ''} ${isBestSlot ? 'best-slot' : ''}`}
                          onClick={() => handleCellClick(idx)}
                          onMouseEnter={(e) => handleMouseEnter(idx, e)}
                          onMouseLeave={handleMouseLeave}
                          data-position={position}
                        >
                          {product ? (
                            <div className="cell-content">
                              <div className="position-label">{position}</div>
                              <div className="product-name">{product.name}</div>
                              <div className="product-price">
                                ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                              </div>
                              <button 
                                className="remove-btn" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveProduct(idx);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="cell-content empty">
                              <div className="position-label">{position}</div>
                              <div className="slotting-fee">Fee: ${fee}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="grid-legend">
                <div className="legend-item">
                  <div className="legend-color best-color"></div>
                  <span>Best slot for profitability</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color occupied-color"></div>
                  <span>Occupied slot</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color empty-color"></div>
                  <span>Empty slot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Store Insights Tooltip */}
        {hoveredSlot !== null && (
          <div
            className="store-insight"
            style={{ top: hoveredPosition.y + 10, left: hoveredPosition.x + 20 }}
          >
            <h3>🏪 Store Insights</h3>
            <p>{storeInsights[hoveredSlot % storeInsights.length]}</p>
            <p className="position-info">Position: {getPositionLabel(hoveredSlot)}</p>
          </div>
        )}
        
        <style jsx>{`
          .container {
            text-align: center;
            background: #f5ede1;
            min-height: 100vh;
            padding: 0;
            font-family: 'Poppins', sans-serif;
          }
          
          .heading-section {
            width: 100%;
            background: #e0c9a7;
            color: #6b4f35;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 30px 0;
          }
          
          .heading-section h1 {
            font-size: 2.5rem;
            margin: 0;
          }
          
          .heading-section p {
            font-size: 1.2rem;
            margin-top: 5px;
          }
          
          .layout-container {
            display: grid;
            grid-template-columns: 350px 1fr;
            gap: 20px;
            padding: 20px;
          }
          
          .panel {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            margin-bottom: 20px;
          }
          
          .panel h2 {
            color: #6b4f35;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 1.3rem;
          }
          
          .help-text {
            color: #7d6450;
            font-size: 0.9rem;
            margin-bottom: 15px;
          }
          
          .no-products {
            text-align: center;
            padding: 20px;
            color: #7d6450;
          }
          
          .add-button {
            background: #8b6f47;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 10px;
          }
          
          .products-list {
            max-height: 300px;
            overflow-y: auto;
            margin-bottom: 15px;
          }
          
          .product-item {
            background: #f8f4ef;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
            border: 2px solid transparent;
          }
          
          .product-item:hover {
            background: #f0e6d9;
            transform: translateY(-2px);
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
          
          .product-price, .product-margin {
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
            margin-bottom: 15px;
          }
          
          .selected-product-info h3 {
            margin: 0 0 5px;
            font-size: 1rem;
            color: #6b4f35;
          }
          
          .selected-product-info p {
            margin: 0;
            font-size: 0.9rem;
            color: #7d6450;
          }
          
          .action-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
          }
          
          .cancel-button {
            background: #e7e2d8;
            color: #6b4f35;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
          }
          
          .save-button {
            background: #8b6f47;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
          }
          
          .save-button:disabled {
            background: #ccbbaa;
            cursor: not-allowed;
          }
          
          .grid-container {
            display: flex;
            flex-direction: column;
            margin-bottom: 20px;
          }
          
          .grid-with-row-labels {
            display: flex;
            align-items: center;
          }
          
          .grid-labels {
            display: flex;
          }
          
          .column-labels {
            margin-left: 30px;
            margin-bottom: 5px;
          }
          
          .row-labels {
            flex-direction: column;
            margin-right: 5px;
          }
          
          .column-label, .row-label {
            width: 30px;
            height: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            color: #6b4f35;
          }
          
          .label-spacer {
            width: 30px;
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
            min-height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .grid-cell:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .grid-cell.occupied {
            background: #e0c9a7;
          }
          
          .grid-cell.best-slot {
            background: #8b6f47;
            color: white;
          }
          
          .grid-cell.best-slot .cell-content.empty .slotting-fee {
            color: white;
          }
          
          .cell-content {
            text-align: center;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5px;
            position: relative;
          }
          
          .position-label {
            position: absolute;
            top: 5px;
            left: 5px;
            font-size: 0.7rem;
            opacity: 0.6;
          }
          
          .product-name {
            font-weight: bold;
            font-size: 0.85rem;
            margin-bottom: 5px;
            color: #6b4f35;
          }
          
          .grid-cell.best-slot .product-name,
          .grid-cell.best-slot .product-price,
          .grid-cell.best-slot .position-label {
            color: white;
          }
          
          .remove-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.1);
            border: none;
            color: #6b4f35;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2;
          }
          
          .slotting-fee {
            font-size: 0.75rem;
            color: #7d6450;
          }
          
          .grid-legend {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.85rem;
            color: #6b4f35;
          }
          
          .legend-color {
            width: 15px;
            height: 15px;
            border-radius: 3px;
          }
          
          .best-color {
            background: #8b6f47;
          }
          
          .occupied-color {
            background: #e0c9a7;
          }
          
          .empty-color {
            background: #f0e6d9;
          }
          
          .store-insight {
            position: fixed;
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
            min-width: 200px;
            z-index: 1000;
            transition: opacity 0.2s ease-in-out;
            opacity: ${hoveredSlot !== null ? 1 : 0};
          }
          
          .store-insight h3 {
            margin: 0 0 5px;
            font-size: 1rem;
            color: #6b4f35;
          }
          
          .store-insight p {
            margin: 0 0 5px;
            font-size: 0.9rem;
            color: #7d6450;
          }
          
          .position-info {
            font-weight: bold;
            margin-top: 5px;
            color: #8b6f47;
          }
          
          @media (max-width: 1024px) {
            .layout-container {
              grid-template-columns: 1fr;
            }
            
            .left-panel {
              order: 1;
            }
            
            .right-panel {
              order: 0;
            }
          }
          
          @media (max-width: 768px) {
            .heading-section h1 {
              font-size: 2rem;
            }
            
            .layout-container {
              padding: 10px;
              gap: 10px;
            }
            
            .panel {
              padding: 15px;
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