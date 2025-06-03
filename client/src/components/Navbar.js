import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const handleSignOut = async () => {
    try {
      await axios.post('http://localhost:4000/api/auth/signout');
      // Clear user data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link to="/chat" className="text-white font-bold text-xl hover:text-gray-300 transition duration-200">
            Chat App
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Welcome, {username || 'User'}</span>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 