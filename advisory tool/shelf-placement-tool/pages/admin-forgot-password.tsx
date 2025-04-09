import { SetStateAction, useState } from "react";
import { useRouter } from "next/router";

export default function AdminForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetData, setResetData] = useState({ token: "", newPassword: "", confirmPassword: "" });

  // Google Apps Script web app URL
  const API_URL = "https://script.google.com/macros/s/AKfycby3_qfj9512USbRiYqAkYf6191xrsAAmDu36qizGtAsI2HE6F6vd6KJCPAqvtAXRMQv/exec";

  const handleEmailChange = (e: { target: { value: SetStateAction<string>; }; }) => {
    setEmail(e.target.value);
    setError("");
  };

  const handleResetDataChange = (e: { target: { name: any; value: any; }; }) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
    setError("");
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
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "forgotPassword",
          email: email,
          isAdmin: true
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        setShowResetForm(true);
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
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "resetPassword",
          email: email,
          token: resetData.token,
          newPassword: resetData.newPassword,
          isAdmin: true
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        router.push("/admin-login");
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
    <div className="forgot-container">
      <div className="left-content">
        <h1>Admin Password Reset</h1>
        
        {!showResetForm ? (
          // Step 1: Request password reset
          <form onSubmit={handleRequestReset}>
            <p>Enter your admin email to reset your password.</p>
            <input 
              type="email" 
              name="email" 
              placeholder="✉️ Email Address" 
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
              onChange={handleResetDataChange} 
              className="input-field"
              disabled={loading} 
            />
            <input 
              type="password" 
              name="newPassword" 
              placeholder="🔒 New Password" 
              onChange={handleResetDataChange} 
              className="input-field"
              disabled={loading} 
            />
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="🔒 Confirm New Password" 
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
          <a href="/admin-login">Back to Login</a>
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
        .input-field { 
          width: 80%; 
          padding: 12px; 
          font-size: 16px; 
          border: 2px solid #c4a98b; 
          border-radius: 8px; 
          margin-bottom: 12px; 
          background: #f8f6f2; 
        }
        .reset-button { 
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
        .reset-button:hover { 
          background: #7a5d3a; 
        }
        .reset-button:disabled { 
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
      `}</style>
    </div>
  );
}