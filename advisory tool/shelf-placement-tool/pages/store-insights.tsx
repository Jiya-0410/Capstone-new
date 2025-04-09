// import { useState, useEffect } from "react";
// import axios from "axios";

// export default function StoreInsights() {
//   const [stores, setStores] = useState([]);

//   useEffect(() => {
//     const scriptURL = "https://script.google.com/macros/s/AKfycbxHZTwUEkRQ-ydlIGdC_x_Htv_csHQSIcTcPa0Tqty2FDsBebc-mV4FsL8XrhCdtb3W/exec?action=getStoreInsights";
//     axios.get(scriptURL).then((res) => setStores(res.data));
//   }, []);

//   return (
    
//       <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
//       <h2 className="text-3xl font-bold text-indigo-700 mb-4">🏪 Store Insights</h2>
//       {stores.map((store, idx) => (
//         <div key={idx}>
//           <h3>{store[0]}</h3>
//           <p>Sales: {store[1]}</p>
//           <p>Profit Conversion: {store[2]}%</p>
//         </div>
//       ))}
//     </div>
//   );
// }
