import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import ApiService from "../utils/api-service";

interface AdminResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AdminForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetData, setResetData] = useState<AdminResetData>({ 
    token: "", 
    newPassword: "", 
    confirmPassword: "" 
  });
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');

  const handleEmailChange = (e: { target: { value: string; }; }) => {
    setEmail(e.target.value);
    setError("");
  };

  const handleResetDataChange = (e: { target: { name: string; value: string; }; }) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
    setError("");
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

  const handleRequestReset = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const data = await ApiService.adminForgotPassword(email);
      
      if (data.success) {
        setSuccess(data.message);
        
        // In a real application, you would send the token via email
        // For this demo, we'll show the token and the reset form
        if (data.token) {
          alert(`For demonstration purposes, your reset token is: ${data.token}`);
        }
        
        setShowResetForm(true);
      } else {
        setError(data.message || "Error requesting password reset");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (!resetData.token || !resetData.newPassword || !resetData.confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (resetData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const data = await ApiService.adminResetPassword(
        email,
        resetData.token,
        resetData.newPassword
      );
      
      if (data.success) {
        alert(data.message);
        router.push("/admin-login");
      } else {
        setError(data.message || "Error resetting password");
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
        <title>{showResetForm ? "Admin Reset Password" : "Admin Forgot Password"}</title>
      </Head>
      <div className="forgot-container">
        <div className="left-content">
          <h1>Admin {showResetForm ? "Reset Password" : "Forgot Password"}</h1>
          
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
          
          {!showResetForm ? (
            // Step 1: Request password reset
            <form onSubmit={handleRequestReset}>
              <p>Enter your admin email to reset your password.</p>
              <input 
                type="email" 
                name="email" 
                placeholder="✉️ Admin Email Address" 
                value={email}
                onChange={handleEmailChange} 
                className="input-field"
                disabled={loading} 
              />
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <button 
                type="submit" 
                className="reset-button"
                disabled={loading}
              >
                {loading ? "Sending..." : "Reset Password"}
              </button>
            </form>
          ) : (
            // Step 2: Enter token and new password
            <form onSubmit={handleResetPassword}>
              <p>Enter the token sent to your email and your new password.</p>
              <input 
                type="text" 
                name="token" 
                placeholder="🔑 Reset Token" 
                value={resetData.token}
                onChange={handleResetDataChange} 
                className="input-field"
                disabled={loading} 
              />
              <input 
                type="password" 
                name="newPassword" 
                placeholder="🔒 New Password" 
                value={resetData.newPassword}
                onChange={handleResetDataChange} 
                className="input-field"
                disabled={loading} 
              />
              <input 
                type="password" 
                name="confirmPassword" 
                placeholder="🔒 Confirm New Password" 
                value={resetData.confirmPassword}
                onChange={handleResetDataChange} 
                className="input-field"
                disabled={loading} 
              />
              {error && <div className="error-message">{error}</div>}
              <button 
                type="submit" 
                className="reset-button"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Set New Password"}
              </button>
            </form>
          )}
          
          <div className="links">
            <a href="/admin-login">Back to Admin Login</a>
          </div>
        </div>
        
        <div className="right-content">
          <img src="/banner4.jpg" alt="Banner" className="banner-image" />
        </div>
        
        <style jsx>{`
          .forgot-container { 
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
            text-align: center;
            width: 80%;
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
          .reset-button { 
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
          .reset-button:hover { 
            background: #7a5d3a; 
          }
          .reset-button:disabled { 
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
          .success-message {
            color: #388e3c;
            background: rgba(56, 142, 60, 0.1);
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
            .forgot-container {
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