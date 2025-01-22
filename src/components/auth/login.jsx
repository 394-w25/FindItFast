import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail, signInWithGoogle, useDbUpdate } from '../../utilities/firebase';
import './auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [update] = useDbUpdate('/users');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            if (!email.endsWith("@u.northwestern.edu")) {
                setError("Please use a Northwestern email.");
                return;
            }
            await loginWithEmail(email, password); // Use Firebase email-password login
            navigate('/found'); // Redirect on successful login
        } catch (err) {
            setError(err.message); // Display Firebase error message
        }
    };

    const handleGoogleSignIn = async () => {
        try {

            const result = await signInWithGoogle();
            console.log('result:', result);
            console.log('result.user:', result.user);
            const userID = (result.user).uid;  
            const email = (result.user).email; 

            if (!email.endsWith("@u.northwestern.edu")) {
                setError("Please use a Northwestern email.");
                return;
            }

            const userData = {
                [userID]:
                {
                    displayName: result.user.displayName,
                    email: result.user.email,
                    photoURL: result.user.photoURL
                }
            };
            await(update(userData));

            navigate('/found');

        } catch (err) {
            setError(err.message);
        }
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
            <button onClick={handleGoogleSignIn} className="auth-button google-button">
                Sign In with Google
            </button>
            <p>
                Don't have an account yet? <Link to="/signup" className="auth-link">Sign Up</Link>
            </p>
        </div>
    );
};

export default Login;
