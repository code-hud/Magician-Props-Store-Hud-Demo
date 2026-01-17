import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { useStore } from '../context/StoreContext';
import { getCartSuggestions } from '../api/client';

export default function ProductSuggestions() {
  const { cart, sessionId } = useStore();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId || cart.length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await getCartSuggestions(sessionId);
        setSuggestions(response.data);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [sessionId, cart]);

  if (!cart.length || (!loading && !suggestions.length)) return null;

  return (
    <div className="product-suggestions">
      <h3>You might also like</h3>
      {loading ? (
        <div className="suggestions-loading">Loading suggestions...</div>
      ) : (
        <div className="suggestions-grid">
          {suggestions.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
