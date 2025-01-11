import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './components.css';

const Login = () => {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Add login logic here
        navigate('/items'); 
    };

    return (
        <div className="auth-page">
            <h1>Sign In</h1>
            <form onSubmit={handleLogin} className="auth-form">
                <input type="text" placeholder="Email" className="auth-input" required />
                <input type="password" placeholder="Password" className="auth-input" required />
                <button type="submit" className="auth-button">Sign In</button>
            </form>
            <p>
                Don't have an account yet? <Link to="/signup" className="auth-link">Sign Up</Link>
            </p>
        </div>
    );
};

export default Login;