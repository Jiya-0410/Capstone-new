import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function GridLayout() {
  const router = useRouter();
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [grid, setGrid] = useState([]);
  const [profitData, setProfitData] = useState({});
  const [showGrid, setShowGrid] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState(null); // Store hovered slot index
  const [hoveredPosition, setHoveredPosition] = useState({ x: 0, y: 0 }); // Track position of hovered slot

  // Dummy store insights for each grid slot (Replace with API call if needed)
  const storeInsights = [
    "Store A - High Sales, 80% Conversion",
    "Store B - Medium Sales, 60% Conversion",
    "Store C - Low Sales, 30% Conversion",
    "Store D - Best Performing",
    "Store E - Average Performance",
    "Store F - Needs Optimization",
  ];

  // Slotting fees for each location (10x10)
  const slottingFees = [...Array(10)].map(() => Array(10).fill(20)); // Simplified slotting fees

  const handleGridSelection = async () => {
    localStorage.setItem("gridSize", JSON.stringify({ rows, cols }));

    // Fetch product data
    const scriptURL =
      "https://script.google.com/macros/s/AKfycby3_qfj9512USbRiYqAkYf6191xrsAAmDu36qizGtAsI2HE6F6vd6KJCPAqvtAXRMQv/exec?action=getProducts";

    const res = await axios.get(scriptURL);
    const products = res.data;
    let maxProfit = 0;
    let bestSlot = null;

    // Generate grid with correct slotting fees
    const calculatedGrid = Array(rows * cols)
      .fill(null)
      .map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        const product = products[0] || { name: "Empty", price: 0, margin: 0 };
        const price = product[2] || 0;
        const margin = product[3] || 0;
        const slottingFee = slottingFees[row][col];

        const profit = price * margin - slottingFee;

        if (profit > maxProfit) {
          maxProfit = profit;
          bestSlot = index;
        }
        return { ...product, profit, row, col };
      });

    setGrid(calculatedGrid);
    setProfitData({ maxProfit, bestSlot });
    setShowGrid(true);
  };

  const handleInputChange = (e, setter) => {
    setter(+e.target.value);
    setShowGrid(false);
  };

  const handleMouseEnter = (index, event) => {
    setHoveredSlot(index);
    setHoveredPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredSlot(null);
  };

  return (
    <div className="container">
      {/* 🔹 Heading Section */}
      <div className="heading-section">
        <h1>Optimize Your Shelf Space</h1>
        <p>Smart placement, maximum profit!</p>
      </div>

      {/* 🔹 Grid Selection Input */}
      <div className="input-section">
        <label>Rows:</label>
        <input type="number" min="1" max="10" value={rows} onChange={(e) => handleInputChange(e, setRows)} />
        <label>Columns:</label>
        <input type="number" min="1" max="10" value={cols} onChange={(e) => handleInputChange(e, setCols)} />
      </div>

      {/* 🔹 Submit Button */}
      <div className="buttons">
        <button onClick={handleGridSelection}>Submit</button>
      </div>

      {/* 🔹 Grid Display (Only Shows After Submit) */}
      {showGrid && (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {grid.map((slot, idx) => (
            <div
              key={idx}
              className={idx === profitData.bestSlot ? "best-slot" : "slot"}
              onMouseEnter={(event) => handleMouseEnter(idx, event)}
              onMouseLeave={handleMouseLeave}
            >
              <strong>{slot.name}</strong>
              <p>₹{slot.profit}</p>
              <p className="fee">Slotting Fee: ₹{slottingFees[slot.row][slot.col]}</p>
            </div>
          ))}
        </div>
      )}

      {/* 🔹 Floating Store Insights Box (Appears Beside Hovered Slot) */}
      {hoveredSlot !== null && (
        <div
          className="store-insight"
          style={{ top: hoveredPosition.y + 10, left: hoveredPosition.x + 20 }}
        >
          <h3>🏪 Store Insights</h3>
          <p>{storeInsights[hoveredSlot % storeInsights.length]}</p>
        </div>
      )}

      <style jsx>{`
        .container {
          text-align: center;
          background: #f5ede1;
          min-height: 100vh;
          padding: 0;
        }
        /* 🔹 Heading Section */
        .heading-section {
          width: 100%;
          height: 150px;
          background: #e0c9a7;
          color: #6b4f35;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .heading-section h1 {
          font-size: 3rem;
          margin: 0;
        }
        .heading-section p {
          font-size: 1.2rem;
          margin-top: 5px;
        }
        .input-section {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin: 20px 0;
        }
        .buttons {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        button {
          background: #a87c5b;
          color: white;
          padding: 10px 15px;
          font-size: 16px;
          border-radius: 5px;
          cursor: pointer;
          border: none;
        }
        .grid {
          display: grid;
          gap: 10px;
          background: #f5ede1;
          padding: 10px;
          margin-top: 20px;
        }
        .slot {
          background: white;
          padding: 15px;
          text-align: center;
          border: 2px solid #c4a484;
          transition: transform 0.2s ease-in-out;
        }
        .slot:hover {
          transform: scale(1.05);
          background: #e8d7b7;
        }
        .best-slot {
          background: #28a745;
          color: white;
          font-weight: bold;
          border: 3px solid black;
        }
        /* 🔹 Floating Store Insights Box */
        .store-insight {
          position: fixed;
          background: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
          min-width: 200px;
          z-index: 1000;
          transition: opacity 0.2s ease-in-out;
          opacity: ${hoveredSlot !== null ? 1 : 0}; /* Fade-in effect */
        }
      `}</style>
    </div>
  );
}

