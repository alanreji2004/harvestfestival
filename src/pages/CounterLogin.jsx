import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { VALID_COUNTERS, setActiveCounter } from '../utils/counterSession';

const CounterLogin = () => {
  const [selectedCounter, setSelectedCounter] = useState('Counter 1');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEnterCounter = (e) => {
    e.preventDefault();
    if (!selectedCounter) {
      setError('Please select a counter.');
      return;
    }

    try {
      setActiveCounter(selectedCounter);
      navigate('/counter');
    } catch (err) {
      setError('Failed to select counter.');
    }
  };

  return (
    <div className="page-wrapper">
      <Header />
      <main className="main-content container-narrow">
        <div className="counter-login-card">
          <div className="card-header text-center">
            <h2 className="text-xl font-bold">BIRIYANI DISTRIBUTION</h2>
            <p className="color-muted">Counter Management System</p>
          </div>

          {error && (
            <div className="alert alert-error mb-4" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleEnterCounter}>
            <div className="form-group mb-4">
              <label htmlFor="counter-select" className="form-label font-semibold">
                Select Counter
              </label>
              <select
                id="counter-select"
                className="form-input counter-select-dropdown"
                value={selectedCounter}
                onChange={(e) => {
                  setSelectedCounter(e.target.value);
                  setError('');
                }}
              >
                {VALID_COUNTERS.map((counter) => (
                  <option key={counter} value={counter}>
                    {counter}
                  </option>
                ))}
              </select>
            </div>

            <div className="counter-grid-selection mb-4">
              {VALID_COUNTERS.map((counter) => (
                <button
                  key={counter}
                  type="button"
                  className={`counter-tile ${selectedCounter === counter ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCounter(counter);
                    setError('');
                  }}
                >
                  <span className="counter-tile-title">{counter}</span>
                </button>
              ))}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg">
              Enter Counter
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CounterLogin;
