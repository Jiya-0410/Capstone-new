import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

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
  slot?: number;
}

export default function ProductEntry() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentShelfId, setCurrentShelfId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product>({
    id: "",
    name: "",
    category: "",
    price: "",
    margin: "",
    size: "",
    buyingDecision: "",
    demand: "",
  });

  useEffect(() => {
    // Check if we're editing an existing product
    const editProductId = localStorage.getItem("editProductId");
    if (editProductId) {
      // Find the product in localStorage
      const products = JSON.parse(localStorage.getItem("products") || "[]");
      const productToEdit = products.find((p: Product) => p.id === editProductId);
      
      if (productToEdit) {
        setProduct(productToEdit);
        setIsEditMode(true);
      }
    }
    
    // Check if we're adding a product to a specific shelf
    const shelfId = localStorage.getItem("currentShelfId");
    if (shelfId) {
      setCurrentShelfId(shelfId);
    }
  }, []);

  const handleChange = (e: any) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!product.name || !product.price || !product.margin) {
      alert("Please fill out all required fields");
      return;
    }
    
    try {
      // Create a copy with proper types for saving
      const productToSave = {
        ...product,
        id: isEditMode ? product.id : `product_${Date.now()}`,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        margin: typeof product.margin === 'string' ? parseFloat(product.margin) : product.margin
      };
      
      // If editing, update the product in localStorage
      if (isEditMode) {
        const products = JSON.parse(localStorage.getItem("products") || "[]");
        const updatedProducts = products.map((p: Product) => 
          p.id === productToSave.id ? productToSave : p
        );
        localStorage.setItem("products", JSON.stringify(updatedProducts));
        
        // Also update in any shelves that contain this product
        const shelves = JSON.parse(localStorage.getItem("shelves") || "[]");
        const updatedShelves = shelves.map((shelf: any) => ({
          ...shelf,
          products: shelf.products.map((p: Product) => 
            p.id === productToSave.id ? { ...productToSave, slot: p.slot } : p
          )
        }));
        localStorage.setItem("shelves", JSON.stringify(updatedShelves));
      } 
      // If adding new product
      else {
        // Save to products library
        const products = JSON.parse(localStorage.getItem("products") || "[]");
        localStorage.setItem("products", JSON.stringify([...products, productToSave]));
        
        // If adding to a shelf, add it to that shelf as well
        if (currentShelfId) {
          const shelves = JSON.parse(localStorage.getItem("shelves") || "[]");
          const updatedShelves = shelves.map((shelf: any) => {
            if (shelf.id === currentShelfId) {
              // Find the next empty slot
              const occupiedSlots = shelf.products.map((p: Product) => p.slot);
              let nextSlot = 0;
              while(occupiedSlots.includes(nextSlot)) {
                nextSlot++;
              }
              
              return {
                ...shelf,
                products: [...shelf.products, { ...productToSave, slot: nextSlot }]
              };
            }
            return shelf;
          });
          localStorage.setItem("shelves", JSON.stringify(updatedShelves));
        }
      }

      // Also try to save to the Google Script API (if available)
      try {
        const scriptURL = "https://script.google.com/macros/s/AKfycby3_qfj9512USbRiYqAkYf6191xrsAAmDu36qizGtAsI2HE6F6vd6KJCPAqvtAXRMQv/exec?action=saveProduct";
        const formData = new FormData();
        Object.keys(productToSave).forEach((key) => formData.append(key, String(productToSave[key as keyof Product])));
        await axios.post(scriptURL, formData);
      } catch (error) {
        console.error("Error saving to Google Script:", error);
        // Continue anyway since we've saved to localStorage
      }

      // Clean up localStorage entries
      localStorage.removeItem("editProductId");
      localStorage.removeItem("currentShelfId");
      
      alert("Product saved successfully!");
      
      // Navigate back based on context
      if (currentShelfId) {
        router.push(`/shelf-detail?id=${currentShelfId}`);
      } else {
        router.push("/product-library");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Please try again.");
    }
  };

  const handleCancel = () => {
    // Clean up localStorage entries
    localStorage.removeItem("editProductId");
    
    // Navigate back based on context
    if (currentShelfId) {
      router.push(`/shelf-detail?id=${currentShelfId}`);
    } else {
      router.push("/product-library");
    }
  };

  return (
    <div className="product-container">
      {/* 🔹 Header Section */}
      <header className="dashboard-header">
        <div className="logo-section">
          <h1>Advisory Tool</h1>
        </div>
        <div className="back-button-container">
          <button onClick={handleCancel} className="back-button">
            ← Back
          </button>
        </div>
      </header>

      {/* 🔹 Hero Section */}
      <div className="hero-section">
        <div className="left-content">
          <h1>{isEditMode ? "Edit Product" : "Add New Product"}</h1>
          <p>Optimize your shelf space with strategic product positioning.</p>
        </div>
        <div className="right-content">
          <img
            src="/banner5.jpg"
            alt="Product Visualization"
            className="hero-image"
          />
        </div>
      </div>

      {/* 🔹 Form Section */}
      <div className="form-section">
        <div className="form-box">
          <h2>📦 {isEditMode ? "Update Product Details" : "Enter Product Details"}</h2>
          <p>Provide essential product information to calculate optimal placement.</p>
          
          <input 
            name="name" 
            placeholder="🔹 Product Name" 
            value={product.name} 
            onChange={handleChange} 
            className="input-field" 
          />
          
          <input 
            name="size" 
            placeholder="📦 Size" 
            value={product.size} 
            onChange={handleChange} 
            className="input-field" 
          />
          
          <input 
            name="price" 
            type="number" 
            placeholder="💰 Price" 
            value={product.price} 
            onChange={handleChange} 
            className="input-field" 
          />
          
          <input 
            name="margin" 
            type="number" 
            placeholder="📈 Margin %" 
            value={product.margin} 
            onChange={handleChange} 
            className="input-field" 
          />
          
          {/* Category Dropdown */}
          <select 
            name="category" 
            value={product.category} 
            onChange={handleChange} 
            className="dropdown"
          >
            <option value="">📂 Select Category</option>
            <option value="fashion">Fashion</option>
            <option value="food">Food & Beverages</option>
            <option value="health">Health</option>
            <option value="beauty">Beauty</option>
            <option value="home">Home & Lifestyle</option>
            <option value="sports">Sports</option>
            <option value="travel">Travel</option>
          </select>

          {/* Buying Decision Dropdown */}
          <select 
            name="buyingDecision" 
            value={product.buyingDecision} 
            onChange={handleChange} 
            className="dropdown"
          >
            <option value="">🛒 Buying Decision</option>
            <option value="essential">Essential</option>
            <option value="perishable">Perishable</option>
            <option value="impulsive">Impulsive Buy</option>
          </select>

          {/* Demand Dropdown */}
          <select 
            name="demand" 
            value={product.demand} 
            onChange={handleChange} 
            className="dropdown"
          >
            <option value="">📊 Demand</option>
            <option value="high">High Demand</option>
            <option value="low">Low Demand</option>
            <option value="seasonal">Seasonal Demand</option>
          </select>
        </div>

        {/* 🔹 Decorative Line Below the Box */}
        <div className="decorative-line"></div>

        {/* 🔹 Action Buttons */}
        <div className="button-group">
          <button onClick={handleCancel} className="cancel-button">
            Cancel
          </button>
          <button onClick={handleSubmit} className="submit-button">
            {isEditMode ? "Update Product" : "Save Product"}
          </button>
        </div>
      </div>

      {/* 🔹 Styling */}
      <style jsx>{`
        /* 🔹 Header styling */
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

        .back-button-container {
          display: flex;
          align-items: center;
        }

        .back-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* 🔹 Page Container */
        .product-container {
          display: flex;
          flex-direction: column;
          background: #f9f6f2; /* Light off-white */
          font-family: 'Poppins', sans-serif;
          min-height: 100vh;
        }

        /* 🔹 Hero Section */
        .hero-section {
          display: flex;
          width: 100%;
          height: 250px;
        }

        .left-content {
          flex: 1;
          background: #e0c9a7; /* Lighter beige */
          color: #6b4f35; /* Soft brown */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding-left: 50px;
        }

        .left-content h1 {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .left-content p {
          font-size: 1.2rem;
          margin-top: 0;
          opacity: 0.9;
        }

        .right-content {
          flex: 1;
          overflow: hidden;
        }
        
        .input-field, .dropdown {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border: 2px solid #c4a98b;
          border-radius: 8px;
          margin-bottom: 12px;
          background: #f8f6f2;
        }
        
        .dropdown {
          cursor: pointer;
        }
        
        .hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* 🔹 Form Section */
        .form-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          background: #fdfaf6; /* Soft beige */
          padding: 50px 0;
          flex: 1;
        }

        .form-box {
          background: white;
          padding: 30px 40px;
          border-radius: 15px;
          max-width: 450px;
          box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .form-box h2 {
          font-size: 1.8rem;
          font-weight: bold;
          color: #6b4f35; /* Soft brown */
        }

        .form-box p {
          font-size: 1rem;
          color: #7d6450; /* Muted brown */
          margin-top: 5px;
          margin-bottom: 20px;
        }

        .input-field {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border: 2px solid #c4a98b; /* Light beige */
          border-radius: 8px;
          transition: 0.3s ease-in-out;
          margin-bottom: 12px;
          background: #f8f6f2; /* Soft off-white */
        }

        .input-field:focus {
          border-color: #a07c5c; /* Medium brown */
          outline: none;
          box-shadow: 0px 4px 10px rgba(160, 124, 92, 0.3);
        }

        /* 🔹 Decorative Line Below the Form */
        .decorative-line {
          width: 300px;
          height: 3px;
          background: #a07c5c; /* Light brown */
          margin-top: 25px;
        }

        /* 🔹 Button Group */
        .button-group {
          display: flex;
          gap: 20px;
          margin-top: 25px;
        }

        .submit-button {
          background: #8b6f47; /* Darker beige */
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: bold;
          border: none;
          cursor: pointer;
          transition: 0.3s;
        }

        .submit-button:hover {
          background: #7a5d3a; /* Darker brown */
        }

        .cancel-button {
          background: #e7e2d8;
          color: #6b4f35;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: bold;
          border: none;
          cursor: pointer;
          transition: 0.3s;
        }

        .cancel-button:hover {
          background: #d9d0c3;
        }
      `}</style>
    </div>
  );
}