import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const banners = ["/banner1.jpg", "/banner2.jpg", "/banner3.jpg", "/banner4.jpg"];

  // Google Apps Script web app URL
  const API_URL = "https://script.google.com/macros/s/AKfycby3_qfj9512USbRiYqAkYf6191xrsAAmDu36qizGtAsI2HE6F6vd6KJCPAqvtAXRMQv/exec";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    // Clear error when user types
    if (error) setError("");
  };

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    // Simple validation
    if (!credentials.email || !credentials.password) {
      setError("Please enter both email and password");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "adminLogin",
          email: credentials.email,
          password: credentials.password
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store admin data in localStorage
        localStorage.setItem("admin", JSON.stringify(data.admin));
        
        // Show success message
        alert(data.message);
        
        // Redirect to admin dashboard
        router.push("/admin-dashboard");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Content - Login Form */}
      <div className="left-content">
        <h1>Admin</h1>
        <p>Sign in to continue to your account.</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            placeholder="✉️ Email Address"
            onChange={handleChange}
            className="input-field"
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="🔒 Password"
            onChange={handleChange}
            className="input-field"
            disabled={loading}
          />
          {error && <div className="error-message">{error}</div>}
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="links">
          <a href="admin-forgot-password">Forgot Password?</a>
        </div>
      </div>
      
      {/* Right Content - Moving Banner */}
      <div className="right-content">
        <img src={banners[currentBanner]} alt="Banner" className="banner-image" />
      </div>
      
      <style jsx>{`
        .login-container {
          display: flex;
          height: 100vh;
          background: #f9f6f2;
          font-family: 'Poppins', sans-serif;
        }
        .left-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #e0c9a7;
          color: #6b4f35;
          padding: 40px;
        }
        .left-content h1 {
          font-size: 3rem;
          font-weight: bold;
        }
        .left-content p {
          font-size: 1.2rem;
          margin-bottom: 20px;
        }
        .input-field {
          width: 80%;
          padding: 12px;
          font-size: 16px;
          border: 2px solid #c4a98b;
          border-radius: 8px;
          margin-bottom: 12px;
          background: #f8f6f2;
        }
        .login-button {
          background: #8b6f47;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: bold;
          border: none;
          cursor: pointer;
          margin-top: 10px;
          transition: 0.3s;
        }
        .login-button:hover {
          background: #7a5d3a;
        }
        .login-button:disabled {
          background: #ccbbaa;
          cursor: not-allowed;
        }
        .links {
          margin-top: 10px;
          display: flex;
          gap: 15px;
        }
        .links a {
          color: #6b4f35;
          text-decoration: none;
          font-weight: bold;
        }
        .right-content {
          flex: 1;
          overflow: hidden;
        }
        .banner-image {
          width: 100%;
          height: 100vh;
          object-fit: cover;
          transition: opacity 0.8s ease-in-out;
        }
        .error-message {
          color: #d32f2f;
          background: rgba(211, 47, 47, 0.1);
          padding: 8px 12px;
          border-radius: 4px;
          width: 80%;
          text-align: center;
          margin-bottom: 10px;
        }
        form {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
      `}</style>
    </div>
  );
}