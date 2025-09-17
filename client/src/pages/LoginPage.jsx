// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const LoginPage = () => {
    // --- State Management ---
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // --- CRITICAL: Auto-fill form from Demo Portal ---
    useEffect(() => {
        // Check if we received credentials from the homepage demo button
        const demoCredentials = location.state;
        if (demoCredentials && demoCredentials.username && demoCredentials.password) {
            // If yes, automatically fill the form
            setFormData({
                username: demoCredentials.username,
                password: demoCredentials.password
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
                localStorage.setItem('user', JSON.stringify(response.data));
                navigate('/');
                window.location.reload();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    // --- Tailwind CSS class strings for reusability ---
    const cardContainer = "min-h-screen flex items-center justify-center bg-gray-100 p-4";
    const formCard = "bg-white p-8 rounded-xl shadow-lg w-full max-w-md";
    const formTitle = "text-3xl font-bold text-center text-gray-800 mb-6";
    const inputGroup = "mb-4";
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    const errorText = "text-red-500 text-sm text-center mt-4";
    const bottomText = "text-center text-sm text-gray-600 mt-6";
    const bottomLink = "font-bold text-pink-500 hover:text-pink-700";

    return (
        <div className={cardContainer}>
            <div className={formCard}>
                <h2 className={formTitle}>Staff Login</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className={inputGroup}>
                        <label htmlFor="username" className={inputLabel}>Username</label>
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
                    <div className={inputGroup}>
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
                    </div>
                    <div className="mt-6">
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>

                    {error && <p className={errorText}>{error}</p>}
                </form>

                <p className={bottomText}>
                    Are you a parent?{' '}
                    <Link to="/parent-login" className={bottomLink}>
                        Go to Parent Portal
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;