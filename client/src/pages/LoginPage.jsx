// src/pages/LoginPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import authService from "../services/authService";

const LoginPage = () => {
  // --- State Management ---
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  // --- CRITICAL: Auto-fill form from Demo Portal ---
  useEffect(() => {
    // Check if we received credentials from the homepage demo button
    const demoCredentials = location.state;
    if (
      demoCredentials &&
      demoCredentials.username &&
      demoCredentials.password
    ) {
      // If yes, automatically fill the form
      setFormData({
        username: demoCredentials.username,
        password: demoCredentials.password,
      });
    }
  }, [location.state]); // This runs whenever the location state changes

  // --- Event Handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(formData);
      if (response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
        navigate("/");
        window.location.reload();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
      setLoading(false);
    }
  };

  // --- Tailwind CSS class strings for reusability ---
  const cardContainer =
    "min-h-screen flex items-center justify-center bg-gray-100 p-4";
  const formCard = "bg-white p-8 rounded-xl shadow-lg w-full max-w-md";
  const formTitle = "text-3xl font-bold text-center text-gray-800 mb-6";
  const inputGroup = "mb-4";
  const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
  const textInput =
    "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
  const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${
    loading ? "opacity-50 cursor-not-allowed" : ""
  }`;
  const errorText = "text-red-500 text-sm text-center mt-4";
  const bottomText = "text-center text-sm text-gray-600 mt-6";
  const bottomLink = "font-bold text-pink-500 hover:text-pink-700";

  return (
    <div className={cardContainer}>
      <div className={formCard}>
        <h2 className={formTitle}>Staff Login</h2>

        <form onSubmit={handleSubmit}>
          <div className={inputGroup}>
            <label htmlFor="username" className={inputLabel}>
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              className={textInput}
              value={formData.username} // Ensure value is controlled
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>
          {/* <div className={inputGroup}>
                        <label htmlFor="password" className={inputLabel}>Password</label>
                        <input 
                            id="password"
                            type="password" 
                            name="password" 
                            className={textInput}
                            value={formData.password} // Ensure value is controlled
                            onChange={handleChange} 
                            placeholder="••••••••"
                            required 
                        />
                    </div> */}
          <div className={inputGroup}>
            <label htmlFor="password" className={inputLabel}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                className={textInput + " pr-10"}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-pink-500"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-closed-icon lucide-eye-closed"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>
          <div className="mt-6">
            <button type="submit" className={submitButton} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          {error && <p className={errorText}>{error}</p>}
        </form>

        <p className={bottomText}>
          Are you a parent?{" "}
          <Link to="/parent-login" className={bottomLink}>
            Go to Parent Portal
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
