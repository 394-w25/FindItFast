import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import MessagingApp from './pages/MessagesPage';
import FoundFeedPage from './pages/FoundFeedPage';
import ClaimedFeedPage from './pages/ClaimedFeedPage';
import ProfilePage from './pages/ProfilePage';
import PostItemPage from './pages/PostItemPage';
import SignUp from './components/auth/signup';
import NavigationBar from './components/navigation/NavigationBar';
import { useAuthState } from './utilities/firebase';
import './App.css';

const ProtectedRoute = ({ element, isAuthenticated, redirectTo }) => {
  return isAuthenticated ? element : <Navigate to={redirectTo} />;
};


const App = () => {
  const location = useLocation();

  const noNavRoutes = ['/', '/signin', '/signup'];

  const [user, loading, error] = useAuthState();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>; // Handle error if authentication fails
  }

  return (
    <>
      <div className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SignInPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/found" element={<FoundFeedPage currentUser={user} />} />
          <Route path="/claimed" element={<ClaimedFeedPage currentUser={user} />} />
          <Route path="/messages" element={<MessagingApp user={user} />} />
          <Route path="/messages/:conversationId" element={<MessagingApp user={user} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/postfound" element={<PostItemPage />} />
          {/* Protected Routes, commenting this for now because it sends the user back to sign in on refresh */}
          {/* <Route
            path="/found"
            element={<ProtectedRoute element={<FoundFeedPage />} isAuthenticated={!!user} redirectTo="/signin" />}
          />
          <Route
            path="/claimed"
            element={<ProtectedRoute element={<ClaimedPage currentUser={user} />} isAuthenticated={!!user} redirectTo="/signin" />}
          />
          <Route
            path="/messages"
            element={<ProtectedRoute element={<MessagesPage />} isAuthenticated={!!user} redirectTo="/signin" />}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute element={<ProfilePage />} isAuthenticated={!!user} redirectTo="/signin" />}
          />
          <Route
            path="/postfound"
            element={<ProtectedRoute element={<PostItemPage />} isAuthenticated={!!user} redirectTo="/signin" />}
          /> */}
        </Routes>
      </div>
      {!noNavRoutes.includes(location.pathname) && <NavigationBar />}
    </>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;