import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    "/banner1.jpg",
    "/banner2.jpg",
    "/banner3.jpg",
    "/banner4.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      {/* 🔹 Full-Screen Header Section */}
      <div className="header-section">
        <img src={images[currentImage]} alt="Background" className="background-image" />
        <div className="content-overlay">
          <h1>Advisory Tool for Product Placement</h1>
          <h2>Optimize Your Shelf Space, Maximize Profits</h2>
          <p>
            Our tool helps analyze product placement efficiency and optimize shelf space 
            using real-time data. With an intuitive interface and analytics, 
            you can improve sales performance and strategic shelf arrangements.
          </p>
        </div>
      </div>

      {/* 🔹 Other Sections */}
      <div className="content-sections">
        {/* 🔸 Choose Your Role Section */}
        <div className="role-section">
          <h2>Choose Your Role</h2>
          <div className="role-buttons">
            <Link href="/user-login"><button className="role-button">User Login</button></Link>
            <Link href="/admin-login"><button className="role-button">Admin Login</button></Link>
          </div>
        </div>

        {/* 🔸 Creators Section */}
        <div className="creators-section">
          <h2>Meet the Creators</h2>
          <div className="creator-list">
            <div className="creator">
              <img src="/jiyaagarwal.jpg" alt="Jiya Agarwal" className="creator-image" />
              <h3>Jiya Agarwal</h3>
              <p>Frontend Developer</p>
            </div>
            <div className="creator">
              <img src="/sakshee.jpg" alt="Sakshee Gite" className="creator-image" />
              <h3>Sakshee Gite</h3>
              <p>Linear Programming Implementation </p>
            </div>
            <div className="creator">
              <img src="/Zeeshan.jpg" alt="Zeeshan Khan" className="creator-image" />
              <h3>Zeeshan Khan</h3>
              <p>Database creation</p>
            </div>
            <div className="creator">
              <img src="/Aman.jpg" alt="Aman Pawar" className="creator-image" />
              <h3>Aman Pawar</h3>
              <p>ML Model Implementation </p>
            </div>
          </div>
        </div>

        {/* 🔸 Contact Section */}
        <div className="contact-section">
          <h2>Contact Us</h2>
          <p>Email: support@advisorytool.com</p>
          <p>Phone: +123 456 7890</p>
        </div>
      </div>

      {/* 🔹 CSS Styling */}
      <style jsx>{`
        .home-container {
          font-family: 'Poppins', sans-serif;
        }

        /* 🔹 Full-Screen Header Section */
        .header-section {
          position: relative;
          width: 100%;
          height: 100vh; /* Full Screen */
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
        }

        .background-image {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(4px) brightness(0.7);
          transition: opacity 1s ease-in-out;
        }

        .content-overlay {
          position: relative;
          background: rgba(0, 0, 0, 0.5);
          padding: 30px;
          border-radius: 15px;
          max-width: 700px;
        }

        .content-overlay h1 { font-size: 3rem; }
        .content-overlay h2 { font-size: 1.8rem; margin-top: 10px; }
        .content-overlay p { font-size: 1.1rem; margin-top: 10px; line-height: 1.6; }

        /* 🔹 Other Sections */
        .content-sections {
          background: #f9f3e6;
          padding: 60px 20px;
        }

        .role-section, .creators-section, .contact-section {
          text-align: center;
          margin-bottom: 60px;
        }

        .role-buttons { display: flex; justify-content: center; gap: 20px; margin-top: 20px; }
        .role-button {
          padding: 14px 20px;
          font-size: 18px;
          font-weight: bold;
          background: #7d6450;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.3s;
        }

        .role-button:hover { background: #5c3d2e; transform: scale(1.05); }

        /* 🔹 Creators Section */
        .creator-list { display: flex; justify-content: center; flex-wrap: wrap; gap: 40px; margin-top: 20px; }
        .creator {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          max-width: 250px;
          text-align: center;
        }

        .creator-image {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 10px;
        }

        .creator h3 { font-size: 1.5rem; color: #5c3d2e; }
        .creator p { font-size: 1rem; color: #7d6450; margin-top: 5px; }

        /* 🔹 Contact Section */
        .contact-section p { font-size: 1.2rem; color: #5c3d2e; }
      `}</style>
    </div>
  );
}
