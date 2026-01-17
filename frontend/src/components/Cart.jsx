import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductSuggestions from './ProductSuggestions';

export default function Cart({ onCheckout }) {
  const { cart, cartTotal, removeProductFromCart } = useStore();

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>

      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.product_id} className="cart-item">
            <div className="cart-item-image">
              {item.product.image_url ? (
                <img src={item.product.image_url} alt={item.product.name} />
              ) : (
                <div className="placeholder-image">🎩</div>
              )}
            </div>

            <div className="cart-item-details">
              <h4>{item.product.name}</h4>
              <p className="cart-item-price">${Number(item.product.price).toFixed(2)}</p>
              <p className="cart-item-quantity">Quantity: {item.quantity}</p>
            </div>

            <div className="cart-item-total">
              <p className="total">${(Number(item.product.price) * item.quantity).toFixed(2)}</p>
              <button
                className="remove-btn"
                onClick={() => removeProductFromCart(item.product_id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping:</span>
          <span>Free</span>
        </div>
        <div className="summary-row total-row">
          <span>Total:</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>

        <button className="checkout-btn" onClick={onCheckout}>
          Proceed to Checkout
        </button>
      </div>

      <ProductSuggestions />
    </div>
  );
}
