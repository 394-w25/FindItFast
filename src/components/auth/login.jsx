import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail, signInWithGoogle, useDbUpdate, database } from '../../utilities/firebase';
import { ref, get } from 'firebase/database';
import Logo from '../logo/Logo';
import googleLogo from '../images/googlelogo.svg';
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
            navigate('/'); // Redirect on successful login
        } catch (err) {
            setError(err.message); // Display Firebase error message
        }
    };

    const handleGoogleSignIn = async () => {
        try {

            const result = await signInWithGoogle();
            // console.log('result:', result);
            const userID = result.uid;

            const userRef = ref(database, `/users/${userID}`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                const userData = {
                    [userID]:
                    {
                        displayName: result.displayName,
                        email: result.email,
                        photoURL: result.photoURL,
                        claimedItems: [],
                        foundItems: [],
                        about: ''
                    }
                };

                await (update(userData));
            }

            navigate('/');

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-page">
            <Logo />
            {/* <h1>Sign In</h1>
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
            </form> */}
            <button onClick={handleGoogleSignIn} className="auth-button google-button">
                <img
                    src={googleLogo}
                    alt="Google logo"
                    className="google-icon"
                />
                Sign In with Google
            </button>
            {error && <p className="error-message">{error}</p>}
            {/* <p>
                Don't have an account yet? <Link to="/signup" className="auth-link">Sign Up</Link>
            </p> */}
        </div>
    );
};

export default Login;
