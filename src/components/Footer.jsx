import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { currentUser } = useAuth();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p>St. Mary's Youth Association, Kundara &bull; Harvest Festival 2026</p>
        {/* <div className="footer-links">
          <Link to="/" className="footer-link">Customer Order Form</Link>
          <span className="divider">&bull;</span>
          <Link to="/counter/login" className="footer-link">Counter Distribution</Link>
          <span className="divider">&bull;</span>
          {currentUser ? (
            <Link to="/admin" className="footer-link">Admin Dashboard</Link>
          ) : (
            <Link to="/admin/login" className="footer-link">Admin Login</Link>
          )}
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
