import axios from 'axios';

// Dynamically build API URL based on current host at runtime
// This allows the frontend to work from any server/IP without rebuilding
const getAPIUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Use current hostname with port 3001
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:3001`;
};

// Create client lazily so window is available
let client = null;

const getClient = () => {
  if (!client) {
    client = axios.create({
      baseURL: getAPIUrl(),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  return client;
};

export const getProducts = (search, category) => {
  const params = {};
  if (search) params.search = search;
  if (category) params.category = category;
  return getClient().get('/products', { params });
};

export const getCategories = () => {
  return getClient().get('/products/categories');
};

export const getProduct = (id) => {
  return getClient().get(`/products/${id}`);
};

export const getCart = (sessionId) => {
  return getClient().get('/cart', {
    params: { sessionId },
  });
};

export const addToCart = (sessionId, productId, quantity) => {
  return getClient().post('/cart/add', { productId, quantity }, {
    params: { sessionId },
  });
};

export const removeFromCart = (sessionId, productId) => {
  return getClient().delete(`/cart/${productId}`, {
    params: { sessionId },
  });
};

export const getCartTotal = (sessionId) => {
  return getClient().get('/cart/total', {
    params: { sessionId },
  });
};

export const getCartSuggestions = (sessionId) => {
  return getClient().get('/cart/suggestions', {
    params: { sessionId },
  });
};

export const clearCart = (sessionId) => {
  return getClient().delete('/cart', {
    params: { sessionId },
  });
};

export const createOrder = (sessionId, customerName, customerEmail, customerPhone, totalAmount, items) => {
  return getClient().post('/orders', {
    customerName,
    customerEmail,
    customerPhone,
    totalAmount,
    items,
  }, {
    params: { sessionId },
  });
};

export const getOrderHistory = (sessionId) => {
  return getClient().get('/orders/history', {
    params: { sessionId },
  });
};
