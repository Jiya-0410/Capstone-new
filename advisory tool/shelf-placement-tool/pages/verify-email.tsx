import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import ApiService from "../utils/api-service";

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

export default function VerifyEmail() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');

  useEffect(() => {
    // Check if user is available in localStorage
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/user-login");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // If the user is already verified, redirect to dashboard
    if (parsedUser.isVerified) {
      router.push("/dashboard");
      return;
    }
    
    setUser(parsedUser);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setError("Please enter verification code");
      return;
    }
    
    if (!user) {
      setError("User data not found. Please login again.");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const data = await ApiService.verifyEmail(verificationCode);
      
      if (data.success) {
        setSuccess(data.message);
        
        // Update user data with verified status
        const updatedUser = { ...user, isVerified: true };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(data.message || "Invalid verification code");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user) {
      setError("User data not found. Please login again.");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const data = await ApiService.resendVerificationCode(user.email);
      
      if (data.success) {
        setSuccess(data.message);
        // For demo purposes, show the token
        if (data.token) {
          alert(`For demonstration purposes, your new verification token is: ${data.token}`);
        }
      } else {
        setError(data.message || "Error resending verification code");
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
        <title>Email Verification</title>
      </Head>
      <div className="verify-container">
        <div className="verify-box">
          <h1>Verify Your Email</h1>
          <p>We've sent a verification code to <strong>{user?.email}</strong>.</p>
          <p>Please enter the code below to verify your account.</p>
          
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
          
          <form onSubmit={handleVerify}>
            <input 
              type="text" 
              placeholder="Enter verification code" 
              value={verificationCode}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            />
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <button 
              type="submit" 
              className="verify-button"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
          
          <div className="resend-link">
            Didn't receive the code? 
            <button 
              onClick={handleResendCode} 
              className="resend-button"
              disabled={loading}
            >
              Resend Code
            </button>
          </div>
          
          <div className="logout-option">
            <button 
              onClick={() => {
                localStorage.removeItem("user");
                router.push("/user-login");
              }}
              className="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
        
        <style jsx>{`
          .verify-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f9f6f2;
            font-family: 'Poppins', sans-serif;
          }
          
          .verify-box {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
            background: #e0c9a7;
            color: #6b4f35;
          }
          
          h1 {
            color: #6b4f35;
            margin-bottom: 20px;
            font-size: 2rem;
          }
          
          p {
            color: #6b4f35;
            margin-bottom: 10px;
            font-size: 1rem;
            line-height: 1.5;
          }
          
          p strong {
            font-weight: bold;
          }
          
          .input-field {
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid #c4a98b;
            border-radius: 8px;
            margin-bottom: 15px;
            background: #f8f6f2;
            text-align: center;
            letter-spacing: 2px;
            font-weight: bold;
          }
          
          .input-field:focus {
            outline: none;
            border-color: #8b6f47;
            box-shadow: 0 0 0 2px rgba(139, 111, 71, 0.2);
          }
          
          .verify-button {
            background: #8b6f47;
            color: white;
            padding: 12px 20px;
            width: 100%;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            border: none;
            cursor: pointer;
            transition: 0.3s;
            margin-top: 10px;
          }
          
          .verify-button:hover {
            background: #7a5d3a;
          }
          
          .verify-button:disabled {
            background: #ccbbaa;
            cursor: not-allowed;
          }
          
          .resend-link {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          
          .resend-button {
            background: none;
            color: #8b6f47;
            border: none;
            font-weight: bold;
            cursor: pointer;
            padding: 0;
            text-decoration: underline;
          }
          
          .resend-button:hover {
            color: #5c3d2e;
          }
          
          .logout-option {
            margin-top: 30px;
            border-top: 1px solid rgba(107, 79, 53, 0.2);
            padding-top: 20px;
          }
          
          .logout-button {
            background: rgba(107, 79, 53, 0.1);
            color: #6b4f35;
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.3s ease;
          }
          
          .logout-button:hover {
            background: rgba(107, 79, 53, 0.2);
          }
          
          .error-message {
            color: #d32f2f;
            background: rgba(211, 47, 47, 0.1);
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 10px;
          }
          
          .success-message {
            color: #388e3c;
            background: rgba(56, 142, 60, 0.1);
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 10px;
          }
          
          form {
            width: 100%;
          }
          
          .api-status-container {
            margin-bottom: 15px;
            width: 100%;
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
          
          @media (max-width: 600px) {
            .verify-box {
              padding: 30px 20px;
              width: 95%;
            }
          }
        `}</style>
      </div>
    </>
  );
}