import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ isAdminView = false }) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="organization-badge">ST. MARY'S YOUTH ASSOCIATION, KUNDARA</div>
        <h1 className="event-title">HARVEST FESTIVAL 2026</h1>
        <h2 className="sub-title">BIRIYANI ORDER</h2>
        <div className="event-date">
          <span>Date of Distribution:</span> <strong>October 11, 2026</strong>
        </div>
      </div>
    </header>
  );
};

export default Header;
