import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './components.css';

const SignUp = () => {
    const navigate = useNavigate();

    const handleSignUp = (e) => {
        e.preventDefault();
        // Add sign-up logic here
        navigate('/items'); 
    };

    return (
        <div className="auth-page">
            <h1>Sign Up</h1>
            <form onSubmit={handleSignUp} className="auth-form">
                <input type="email" placeholder="Email" className="auth-input" required />
                <input type="password" placeholder="Password" className="auth-input" required />
                <input type="password" placeholder="Confirm Password" className="auth-input" required />
                <button type="submit" className="auth-button">Sign Up</button>
            </form>
            <p>
                Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
            </p>
        </div>
    );
};

export default SignUp;