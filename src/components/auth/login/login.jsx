import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();

        const userPassword = 'password'; // Placeholder password; replace with actual authentication logic

        setError('');

        if (password !== userPassword) {
            setError('Password is incorrect');
            return;
        }

        navigate('/found');
    };

    return (
        <div className="auth-page">
            <h1>Sign In</h1>
            <form onSubmit={handleLogin} className="auth-form">
                <input
                    type="email"
                    placeholder="Email"
                    className="auth-input"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="auth-input"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="auth-button">Sign In</button>
            </form>
            <p>
                Don't have an account yet? <Link to="/signup" className="auth-link">Sign Up</Link>
            </p>
        </div>
    );
};

export default Login;
