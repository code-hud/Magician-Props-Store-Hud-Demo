const { randomBytes } = require('node:crypto');

const BASE_URL = process.env.API_URL || 'http://backend:3001';

// Utility functions
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

// Generate a unique session ID for this load tester instance
const sessionId = `lt-${Math.random().toString(36).substr(2, 8)}-${Math.random().toString(36).substr(2, 4)}`;

// Simulated customer account IDs — rotated per cycle to mimic multi-tenant traffic
const ACCOUNT_IDS = ['acme-corp', 'globex-inc', 'initech', 'umbrella-co', 'wayne-ent'];

// Generate a W3C traceparent header. The Hud SDK auto-collects this from
// incoming HTTP requests for distributed tracing.
// Format: 00-<trace-id 32hex>-<span-id 16hex>-01
const generateTraceparent = () => {
  const traceId = randomBytes(16).toString('hex');
  const spanId = randomBytes(8).toString('hex');
  return `00-${traceId}-${spanId}-01`;
};

let currentAccountId = ACCOUNT_IDS[0];

const fetchWithTrace = (url, init = {}) => {
  const headers = {
    ...(init.headers || {}),
    traceparent: generateTraceparent(),
    'X-Account-Id': currentAccountId,
  };
  return fetch(url, { ...init, headers });
};

console.log(`[${new Date().toISOString()}] Load Tester started with session: ${sessionId}`);

async function getProducts() {
  try {
    const response = await fetchWithTrace(`${BASE_URL}/products`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const products = await response.json();
    return products;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching products:`, error.message);
    return [];
  }
}

async function addToCart(productId, quantity) {
  try {
    const response = await fetchWithTrace(`${BASE_URL}/cart/add?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        quantity,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await response.json();
    console.log(`[${new Date().toISOString()}] ✓ Added product ${productId} (qty: ${quantity}) to cart`);
    return true;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] ✗ Error adding to cart:`,
      error.message
    );
    return false;
  }
}

async function getCart() {
  try {
    const response = await fetchWithTrace(`${BASE_URL}/cart?sessionId=${sessionId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const cart = await response.json();
    return cart;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching cart:`, error.message);
    return [];
  }
}

async function getCartSuggestions() {
  try {
    const response = await fetchWithTrace(`${BASE_URL}/cart/suggestions?sessionId=${sessionId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const suggestions = await response.json();
    console.log(`[${new Date().toISOString()}] ✓ Got ${suggestions.length} product suggestions`);
    return suggestions;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Error fetching suggestions:`, error.message);
    return [];
  }
}

async function checkout(cartItems) {
  try {
    const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || undefined;

    const response = await fetchWithTrace(`${BASE_URL}/orders?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: `Load Tester ${sessionId.split('-')[1]}`,
        customerEmail: `load-tester-${sessionId}@test.local`,
        customerPhone: '555-012-3456',
        totalAmount,
        items: cartItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      }),
    });

    if (response.ok) {
      console.log(
        `[${new Date().toISOString()}] ✓ Checkout successful! Order total: $${totalAmount.toFixed(2)}`
      );
      return true;
    } else {
      const statusCode = response.status;
      const statusText = response.statusText;
      console.error(
        `[${new Date().toISOString()}] ✗ Checkout failed! HTTP ${statusCode} ${statusText}`
      );

      if (statusCode === 429) {
        console.warn(`[${new Date().toISOString()}] ⚠️  RATE LIMITED - Too many requests!`);
      }

      return false;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Checkout error:`, error.message);
    return false;
  }
}

async function runCycle() {
  currentAccountId = ACCOUNT_IDS[Math.floor(Math.random() * ACCOUNT_IDS.length)];
  console.log(`\n[${new Date().toISOString()}] ========== NEW CYCLE START (account: ${currentAccountId}) ==========`);

  // Fetch products
  const products = await getProducts();
  if (products.length === 0) {
    console.warn(`[${new Date().toISOString()}] No products available, skipping cycle`);
    return;
  }

  // Clear cart (fetch and note what we're clearing)
  const existingCart = await getCart();
  if (existingCart.length > 0) {
    console.log(
      `[${new Date().toISOString()}] Clearing ${existingCart.length} items from cart`
    );
  }

  // Randomly decide how many products to add (0-10)
  const numProductsToAdd = randomInt(0, 10);
  console.log(`[${new Date().toISOString()}] Will add ${numProductsToAdd} products to cart`);

  // Add random products
  const addedProductIds = [];
  for (let i = 0; i < numProductsToAdd; i++) {
    const product = products[randomInt(0, products.length - 1)];
    const quantity = randomInt(1, 5);
    await addToCart(product.id, quantity);
    addedProductIds.push(product.id);
  }

  // Every once in a while, try to add the same product again
  if (addedProductIds.length > 0 && Math.random() < 0.3) {
    const duplicateProduct = products.find(
      (p) => p.id === addedProductIds[randomInt(0, addedProductIds.length - 1)]
    );
    if (duplicateProduct) {
      const quantity = randomInt(1, 3);
      console.log(
        `[${new Date().toISOString()}] 🔄 Adding same product ${duplicateProduct.id} again`
      );
      await addToCart(duplicateProduct.id, quantity);
    }
  }

  // Get cart and suggestions (simulating cart page view)
  const cart = await getCart();
  await getCartSuggestions();

  console.log(`[${new Date().toISOString()}] Attempting checkout with ${cart.length} items...`);
  await checkout(cart);

  // Sleep for random time between 10-60 seconds
  const sleepTime = randomInt(10000, 60000);
  const sleepSeconds = (sleepTime / 1000).toFixed(1);
  console.log(
    `[${new Date().toISOString()}] ========== CYCLE END - Sleeping for ${sleepSeconds}s ==========`
  );
  await sleep(sleepTime);
}

// Main loop
async function main() {
  while (true) {
    try {
      await runCycle();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Unexpected error:`, error.message);
      await sleep(5000); // Wait before retrying
    }
  }
}

main();
