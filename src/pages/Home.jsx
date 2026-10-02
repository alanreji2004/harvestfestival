import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import OrderForm from '../components/OrderForm';
import OrderSuccess from '../components/OrderSuccess';

const LOCAL_STORAGE_KEY = 'harvest_festival_latest_order';

const Home = () => {
  const [placedOrder, setPlacedOrder] = useState(null);

  // Restore latest order receipt from local storage if customer refreshes page
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setPlacedOrder(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to parse local order receipt:', e);
    }
  }, []);

  const handleOrderSuccess = (order) => {
    setPlacedOrder(order);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(order));
    } catch (e) {
      console.warn('Failed to save order receipt locally:', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setPlacedOrder(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear local order receipt:', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-wrapper">
      <Header />
      <main className="main-content container-narrow">
        {placedOrder ? (
          <OrderSuccess order={placedOrder} onReset={handleResetForm} />
        ) : (
          <OrderForm onOrderSuccess={handleOrderSuccess} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;
