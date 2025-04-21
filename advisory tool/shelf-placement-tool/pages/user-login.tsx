import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import ApiService from "../utils/api-service";

interface LoginCredentials {
  email: string;
  password: string;
}

export default function UserLogin() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({ 
    email: "", 
    password: "" 
  });
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const banners = ["/banner1.jpg", "/banner2.jpg", "/banner3.jpg", "/banner4.jpg"];

  useEffect(() => {
    // Check if user is already logged in
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      // If user is logged in but not verified, redirect to verification page
      if (!user.isVerified) {
        router.push("/verify-email");
      } else {
        // If user is logged in and verified, redirect to dashboard
        router.push("/dashboard");
      }
    }
    
    // Set banner rotation interval
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

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

  const handleLogin = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    // Validate inputs
    if (!credentials.email || !credentials.password) {
      setError("Please enter both email and password");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const data = await ApiService.userLogin(
        credentials.email,
        credentials.password
      );
      
      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Show success message
        alert(data.message);
        
        // Check if user's email is verified
        if (!data.user.isVerified) {
          router.push("/verify-email");
        } else {
          // Redirect to dashboard
          router.push("/dashboard");
        }
      } else {
        setError(data.message || "Login failed");
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
        <title>User Login</title>
      </Head>
      <div className="login-container">
        {/* Left Content - Login Form */}
        <div className="left-content">
          <h1>User Login</h1>
          <p>Sign in to continue to your account.</p>
          
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
          
          <form onSubmit={handleLogin}>
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
            <a href="/user-forgot-password">Forgot Password?</a>
            <a href="/user-signup">Create an Account</a>
          </div>
          <div className="admin-link">
            <a href="/admin-login">Admin Login</a>
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
            margin-bottom: 10px;
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
          .input-field:focus {
            outline: none;
            border-color: #8b6f47;
            box-shadow: 0 0 0 2px rgba(139, 111, 71, 0.2);
          }
          .login-button {
            background: #8b6f47;
            color: white;
            padding: 12px 20px;
            width: 80%;
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
            margin-top: 20px;
            display: flex;
            gap: 30px;
          }
          .links a, .admin-link a {
            color: #6b4f35;
            text-decoration: none;
            font-weight: bold;
            transition: color 0.3s ease;
          }
          .links a:hover, .admin-link a:hover {
            color: #8b6f47;
            text-decoration: underline;
          }
          .admin-link {
            margin-top: 30px;
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
            .login-container {
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
}