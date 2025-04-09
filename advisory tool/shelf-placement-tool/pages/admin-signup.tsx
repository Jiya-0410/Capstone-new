import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminSignup() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ name: "", email: "", password: "", adminCode: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Google Apps Script web app URL
  const API_URL = "https://script.google.com/macros/s/AKfycby3_qfj9512USbRiYqAkYf6191xrsAAmDu36qizGtAsI2HE6F6vd6KJCPAqvtAXRMQv/exec";

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    // Clear error when user types
    if (error) setError("");
  };

  const handleSignup = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    // Simple validation
    if (!credentials.name || !credentials.email || !credentials.password || !credentials.adminCode) {
      setError("All fields are required");
      return;
    }
    
    if (credentials.password.length < 6) {
      setError("Password must be at least 6 characters");
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
          action: "adminSignup",
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
          adminCode: credentials.adminCode
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
    <div className="signup-container">
      {/* Left Content - Signup Form */}
      <div className="left-content">
        <h1>Admin Signup</h1>
        <p>Create an admin account to get started.</p>
        <form onSubmit={handleSignup}>
          <input 
            type="text" 
            name="name" 
            placeholder="👤 Full Name" 
            onChange={handleChange} 
            className="input-field"
            disabled={loading}
          />
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
          <input 
            type="password" 
            name="adminCode" 
            placeholder="🔑 Admin Authorization Code" 
            onChange={handleChange} 
            className="input-field"
            disabled={loading}
          />
          {error && <div className="error-message">{error}</div>}
          <button 
            type="submit" 
            className="signup-button"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <div className="links">
          <a href="/admin-login">Already have an account? Login</a>
        </div>
      </div>

      {/* Right Content - Banner */}
      <div className="right-content">
        <img src="/banner2.jpg" alt="Banner" className="banner-image" />
      </div>

      <style jsx>{`
        .signup-container { 
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
        .input-field { 
          width: 80%; 
          padding: 12px; 
          font-size: 16px; 
          border: 2px solid #c4a98b; 
          border-radius: 8px; 
          margin-bottom: 12px; 
          background: #f8f6f2; 
        }
        .signup-button { 
          background: #8b6f47; 
          color: white; 
          padding: 12px 20px; 
          border-radius: 8px; 
          font-size: 1rem; 
          font-weight: bold; 
          border: none; 
          cursor: pointer; 
          transition: 0.3s; 
        }
        .signup-button:hover { 
          background: #7a5d3a; 
        }
        .signup-button:disabled { 
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