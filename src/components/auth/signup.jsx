import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpWithEmail, useDbUpdate } from '../../utilities/firebase';
import './auth.css';

const SignUp = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [update] = useDbUpdate('/users');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const userCredential = await signUpWithEmail(email, password);

            const userID = userCredential.uid;

            const userData = {
                [userID]:
                {
                    displayName: username,
                    email: userCredential.email,
                    photoURL: ""
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
            <h1>Sign Up</h1>
            <form onSubmit={handleSignUp} className="auth-form">
                <input
                    type="text"
                    placeholder="Username"
                    required
                    value={username}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 10 && !value.includes(' ')) {
                            setUsername(value);
                        }
                    }}  
                />
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
                <input
                    type="password"
                    placeholder="Confirm Password"
                    className="auth-input"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="auth-button">Sign Up</button>
            </form>
            <p>
                Already have an account? <Link to="/signin" className="auth-link">Sign In</Link>
            </p>
        </div>
    );
};

export default SignUp;
