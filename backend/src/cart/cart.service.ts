import { Injectable } from '@nestjs/common';
import { CartItem } from './entities/cart-item.entity';
import { CartRepository } from './repositories/cart.repository';
import { ProductRepository } from '../products/repositories/product.repository';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private productRepository: ProductRepository,
  ) {}

  async getCart(sessionId: string): Promise<CartItem[]> {
    return this.cartRepository.findBySessionId(sessionId);
  }

  async addToCart(
    sessionId: string,
    productId: number,
    quantity: number = 1,
  ): Promise<CartItem> {
    return this.cartRepository.addItem(sessionId, productId, quantity);
  }

  async removeFromCart(sessionId: string, productId: number): Promise<void> {
    await this.cartRepository.removeItem(sessionId, productId);
  }

  async updateQuantity(
    sessionId: string,
    productId: number,
    quantity: number,
  ): Promise<CartItem> {
    return this.cartRepository.updateQuantity(sessionId, productId, quantity);
  }

  async clearCart(sessionId: string): Promise<void> {
    await this.cartRepository.clearCart(sessionId);
  }

  async getCartTotal(sessionId: string): Promise<number> {
    const cartItems = await this.cartRepository.findBySessionId(sessionId);

    return cartItems.reduce(
      (total, item) => total + Number(item.product.price) * item.quantity,
      0,
    );
  }

  async getSuggestions(sessionId: string): Promise<Product[]> {
    const cartItems = await this.cartRepository.findBySessionId(sessionId);
    if (cartItems.length === 0) return [];

    const categoryCounts: Record<string, number> = {};
    cartItems.forEach((item) => {
      const cat = item.product?.category;
      if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const primaryCategory = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    if (!primaryCategory) return [];

    const products = await this.productRepository.searchWithFilters(
      '',
      primaryCategory,
    );

    const cartProductIds = new Set(cartItems.map((i) => i.product_id));
    const availableProducts = products.filter((p) => !cartProductIds.has(p.id));

    // Shuffle and pick 3 random products
    const shuffled = availableProducts.sort(() => Math.random() - 0.5);
    const suggestions = shuffled.slice(0, 3);

    return suggestions;
  }
}
