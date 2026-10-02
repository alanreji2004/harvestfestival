import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import OrderForm from '../components/OrderForm';
import OrderSuccess from '../components/OrderSuccess';

const Home = () => {
  const [placedOrder, setPlacedOrder] = useState(null);

  const handleOrderSuccess = (order) => {
    setPlacedOrder(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setPlacedOrder(null);
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
