// // import { useState, useEffect } from "react";
// import { useRouter } from "next/router";

// // Define types
// interface Product {
//   id: string;
//   name: string;
//   category: string;
//   price: number | string;
//   margin: number | string;
//   size: string;
//   buyingDecision: string;
//   demand: string;
//   slot: number;
// }

// interface Shelf {
//   id: string;
//   name: string;
//   rows: number;
//   cols: number;
//   created: string;
//   products: Product[];
// }

// export default function ShelfDetail() {
//   const router = useRouter();
//   const { id: shelfId } = router.query;
//   const [shelf, setShelf] = useState<Shelf | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
//   const [showRemoveProductModal, setShowRemoveProductModal] = useState<boolean>(false);
//   const [optimizationResult, setOptimizationResult] = useState<any>(null);
//   const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

//   useEffect(() => {
//     if (shelfId) {
//       fetchShelfData();
//     }
//   }, [shelfId]);

//   const fetchShelfData = async () => {
//     setLoading(true);
//     try {
//       const shelves = JSON.parse(localStorage.getItem("shelves") || "[]");
//       const foundShelf = shelves.find((s: Shelf) => s.id === shelfId);

//       if (foundShelf) {
//         setShelf(foundShelf);
//       } else {
//         alert("Shelf not found!");
//         router.push("/dashboard");
//       }
//     } catch (error) {
//       console.error("Error fetching shelf data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddProduct = () => {
//     localStorage.setItem("currentShelfId", shelfId as string);
//     localStorage.removeItem("editProductId");
//     router.push("/product-entry");
//   };

//   const handleRemoveProduct = (product: Product) => {
//     setSelectedProduct(product);
//     setShowRemoveProductModal(true);
//   };

//   const confirmRemoveProduct = () => {
//     if (!shelf || !selectedProduct) return;

//     try {
//       const updatedProducts = shelf.products.filter(p => p.id !== selectedProduct.id);

//       const updatedShelf = { ...shelf, products: updatedProducts };
//       updateShelfInStorage(updatedShelf);
//       setShowRemoveProductModal(false);
//       setSelectedProduct(null);
//     } catch (error) {
//       console.error("Error removing product:", error);
//       alert("Failed to remove product");
//     }
//   };

//   const handleEditProduct = (product: Product) => {
//     localStorage.setItem("editProductId", product.id);
//     localStorage.setItem("currentShelfId", shelfId as string);
//     router.push("/product-entry");
//   };

//   const handleOptimizeShelf = () => {
//     if (!shelf) return;

//     setIsOptimizing(true);

//     try {
//       const products = [...shelf.products];
//       products.sort((a, b) => parseFloat(a.margin as string) - parseFloat(b.margin as string));

//       const totalSlots = shelf.rows * shelf.cols;

//       const middleRowStart = Math.floor(shelf.rows / 2) * shelf.cols;
//       const middleRowEnd = middleRowStart + shelf.cols - 1;

//       const slotsByVisibility: number[] = [];
//       for (let i = middleRowStart; i <= middleRowEnd; i++) slotsByVisibility.push(i);

//       for (let row = 0; row < shelf.rows; row++) {
//         if (row === Math.floor(shelf.rows / 2)) continue;
//         for (let col = 0; col < shelf.cols; col++) slotsByVisibility.push(row * shelf.cols + col);
//       }

//       const optimizedProducts = products.map((product, index) => ({
//         ...product,
//         slot: slotsByVisibility[index] || product.slot,
//       }));

//       const updatedShelf = { ...shelf, products: optimizedProducts };
//       updateShelfInStorage(updatedShelf);

//       setOptimizationResult({
//         message: "Shelf optimized based on product margins and visibility",
//         recommendations: [
//           "High-margin products placed at eye level",
//           "Essential products placed at easily accessible spots",
//           "Low-margin products placed at less visible areas",
//         ],
//       });

//       setShelf(updatedShelf);
//     } catch (error) {
//       console.error("Error optimizing shelf:", error);
//       alert("Failed to optimize shelf layout");
//     } finally {
//       setIsOptimizing(false);
//     }
//   };

//   const updateShelfInStorage = (updatedShelf: Shelf) => {
//     const shelves = JSON.parse(localStorage.getItem("shelves") || "[]");
//     const updatedShelves = shelves.map((s: Shelf) =>
//       s.id === updatedShelf.id ? updatedShelf : s
//     );
//     localStorage.setItem("shelves", JSON.stringify(updatedShelves));
//     setShelf(updatedShelf);
//   };

//   const getCategoryColor = (category: string) => {
//     const colors: { [key: string]: string } = {
//       fashion: "#e91e63",
//       food: "#ff9800",
//       health: "#4caf50",
//       beauty: "#9c27b0",
//       home: "#2196f3",
//       sports: "#f44336",
//       travel: "#009688",
//       default: "#757575",
//     };
//     return colors[category] || colors.default;
//   };

//   const handleGoBack = () => {
//     router.push("/dashboard");
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading">Loading shelf data...</div>
//       </div>
//     );
//   }

//   if (!shelf) {
//     return (
//       <div className="error-container">
//         <div className="error">Shelf not found</div>
//         <button onClick={handleGoBack} className="back-button">
//           Back to Dashboard
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="shelf-detail-container">
//       <header className="dashboard-header">
//         <div className="logo-section">
//           <h1>Advisory Tool</h1>
//         </div>
//         <div className="back-button-container">
//           <button onClick={handleGoBack} className="back-button">
//             ← Back to Dashboard
//           </button>
//         </div>
//       </header>

//       <div className="main-content">
//         <div className="shelf-header">
//           <h2>{shelf.name}</h2>
//           <p>Size: {shelf.rows} x {shelf.cols} | Created: {shelf.created} | Products: {shelf.products.length}</p>
//           <button onClick={handleAddProduct}>+ Add Product</button>
//           <button onClick={handleOptimizeShelf} disabled={isOptimizing || !shelf.products.length}>
//             {isOptimizing ? "Optimizing..." : "Optimize Shelf"}
//           </button>
//         </div>

//         {optimizationResult && (
//           <div>
//             <h3>Optimization Results</h3>
//             <p>{optimizationResult.message}</p>
//             <ul>{optimizationResult.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}</ul>
//             <button onClick={() => setOptimizationResult(null)}>Close</button>
//           </div>
//         )}

//         <div style={{ gridTemplateColumns: `repeat(${shelf.cols}, 1fr)` }}>
//           {Array.from({ length: shelf.rows * shelf.cols }).map((_, index) => {
//             const product = shelf.products.find(p => p.slot === index);
//             return (
//               <div key={index}>
//                 {product && (
//                   <>
//                     <span>{product.name}</span>
//                     <button onClick={() => handleEditProduct(product)}>Edit</button>
//                     <button onClick={() => handleRemoveProduct(product)}>Remove</button>
//                   </>
//                 )}
//               </div>
//             );
//           })}
//         </div>
        
//         {showRemoveProductModal && (
//           <>
//             Confirm removal of product "{selectedProduct?.name}"?
//             <button onClick={confirmRemoveProduct}>Confirm</button>
//             <button onClick={() => setShowRemoveProductModal(false)}>Cancel</button>
//           </>
//         )}
        
//       </div>
//     </div>
//   );
// }
