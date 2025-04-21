import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import ApiService from "../utils/api-service";

interface AdminSignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  adminCode: string;
}

export default function AdminSignup() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<AdminSignupData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminCode: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');

  const handleChange = (e: { target: { name: string; value: string; }; }) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    // Clear error when user types
    if (error) setError("");
  };

  const checkApiConnection = async () => {
    if (apiStatus === 'checking') return;
    
    setApiStatus('checking');
    try {
      const result = await ApiService.checkApiStatus();
      if (result.success) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch (err) {
      setApiStatus('error');
    }
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
    
    if (credentials.password !== credentials.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const data = await ApiService.adminSignup(
        credentials.name,
        credentials.email,
        credentials.password,
        credentials.adminCode
      );
      
      if (data.success) {
        // Store admin data in localStorage
        localStorage.setItem("admin", JSON.stringify(data.admin));
        
        // Show success message
        alert(data.message);
        
        // Redirect to admin dashboard
        router.push("/admin-dashboard");
      } else {
        setError(data.message || "Error creating admin account");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Signup</title>
      </Head>
      <div className="signup-container">
        {/* Left Content - Signup Form */}
        <div className="left-content">
          <h1>Admin Signup</h1>
          <p>Create an admin account to manage the system.</p>
          
          {/* API Connection Status Button */}
          <div className="api-status-container">
            <button 
              onClick={checkApiConnection}
              className={`api-status-button ${apiStatus}`}
              disabled={apiStatus === 'checking'}
            >
              {apiStatus === 'idle' && 'Check API Connection'}
              {apiStatus === 'checking' && 'Checking...'}
              {apiStatus === 'connected' && 'API Connected ✓'}
              {apiStatus === 'error' && 'API Connection Failed ✗'}
            </button>
          </div>
          
          <form onSubmit={handleSignup}>
            <input 
              type="text" 
              name="name" 
              placeholder="👤 Full Name" 
              value={credentials.name}
              onChange={handleChange} 
              className="input-field"
              disabled={loading}
            />
            <input 
              type="email" 
              name="email" 
              placeholder="✉️ Email Address" 
              value={credentials.email}
              onChange={handleChange} 
              className="input-field"
              disabled={loading}
            />
            <input 
              type="password" 
              name="password" 
              placeholder="🔒 Password" 
              value={credentials.password}
              onChange={handleChange} 
              className="input-field"
              disabled={loading}
            />
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="🔒 Confirm Password" 
              value={credentials.confirmPassword}
              onChange={handleChange} 
              className="input-field"
              disabled={loading}
            />
            <input 
              type="password" 
              name="adminCode" 
              placeholder="🔑 Admin Authorization Code" 
              value={credentials.adminCode}
              onChange={handleChange} 
              className="input-field"
              disabled={loading}
            />
            <div className="admin-code-hint">
              <p>You need a valid admin authorization code to create an admin account.</p>
              <p>Default code for testing: secretAdminCode123</p>
            </div>
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
          .left-content h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
          }
          .left-content p {
            font-size: 1.1rem;
            margin-bottom: 20px;
            opacity: 0.9;
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
          .input-field:focus {
            outline: none;
            border-color: #8b6f47;
            box-shadow: 0 0 0 2px rgba(139, 111, 71, 0.2);
          }
          .admin-code-hint {
            width: 80%;
            font-size: 0.85rem;
            color: #6b4f35;
            opacity: 0.8;
            margin-bottom: 12px;
            text-align: center;
          }
          .admin-code-hint p {
            margin: 0;
            font-size: 0.85rem;
          }
          .signup-button { 
            background: #8b6f47; 
            color: white; 
            padding: 12px 20px;
            width: 80%;
            border-radius: 8px; 
            font-size: 1rem; 
            font-weight: bold; 
            border: none; 
            cursor: pointer; 
            transition: 0.3s;
            margin-top: 10px;
          }
          .signup-button:hover { 
            background: #7a5d3a; 
          }
          .signup-button:disabled { 
            background: #ccbbaa; 
            cursor: not-allowed; 
          }
          .links { 
            margin-top: 20px; 
            display: flex; 
            gap: 15px; 
          }
          .links a { 
            color: #6b4f35; 
            text-decoration: none; 
            font-weight: bold;
            transition: color 0.3s ease;
          }
          .links a:hover {
            color: #8b6f47;
            text-decoration: underline;
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
          .api-status-container {
            margin-bottom: 15px;
            width: 80%;
          }
          .api-status-button {
            width: 100%;
            padding: 8px 12px;
            border-radius: 4px;
            border: none;
            font-weight: bold;
            cursor: pointer;
            transition: 0.3s;
            background: #f0f0f0;
            color: #333;
          }
          .api-status-button.checking {
            background: #f8d486;
            color: #825b00;
          }
          .api-status-button.connected {
            background: #c8e6c9;
            color: #2e7d32;
          }
          .api-status-button.error {
            background: #ffcdd2;
            color: #c62828;
          }
          .api-status-button:hover:not(:disabled) {
            opacity: 0.9;
          }
          
          @media (max-width: 768px) {
            .signup-container {
              flex-direction: column;
            }
            .right-content {
              display: none;
            }
            .left-content {
              width: 100%;
              padding: 20px;
            }
          }
        `}</style>
      </div>
    </>
  );