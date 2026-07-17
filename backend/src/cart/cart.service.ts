import { Injectable } from '@nestjs/common';
import { CartItem } from './entities/cart-item.entity';
import { CartRepository } from './repositories/cart.repository';
import {
  ProductsService,
  ProductWithPopularity,
} from '../products/products.service';
import { normalizeAmount, roundCurrency } from '../common/pricing.util';
import { OrderRepository } from '../orders/repositories/order.repository';

@Injectable()
export class CartService {
  // Ranking weights for suggestions. The current cart is the primary driver;
  // categories the customer has purchased before get a secondary boost.
  private static readonly PRIMARY_CATEGORY_WEIGHT = 2000;
  private static readonly PURCHASED_CATEGORY_WEIGHT = 1000;

  constructor(
    private cartRepository: CartRepository,
    private productsService: ProductsService,
    private orderRepository: OrderRepository,
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

    const total = cartItems.reduce(
      (sum, item) => sum + normalizeAmount(item.product.price) * item.quantity,
      0,
    );
    return roundCurrency(total);
  }

  async getSuggestions(sessionId: string): Promise<ProductWithPopularity[]> {
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

    // Categories this customer has purchased before, used as a ranking boost so
    // suggestions reflect their history in addition to what's in the cart now.
    const pastOrders = await this.orderRepository.findBySessionId(sessionId);
    const purchasedCategories = new Set<string>();
    pastOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const cat = item.product?.category;
        if (cat) purchasedCategories.add(cat);
      });
    });

    // Candidate pool: the cart's primary category plus any category the customer
    // has bought from before, so past purchases can surface new items too.
    const candidateCategories = [
      primaryCategory,
      ...[...purchasedCategories].filter((cat) => cat !== primaryCategory),
    ];
    const productLists = await Promise.all(
      candidateCategories.map((cat) => this.productsService.findAll('', cat)),
    );

    const seen = new Set<number>();
    const candidates: ProductWithPopularity[] = [];
    for (const list of productLists) {
      for (const product of list) {
        if (!seen.has(product.id)) {
          seen.add(product.id);
          candidates.push(product);
        }
      }
    }

    // Repurchase allowed: only exclude items already in the cart.
    const cartProductIds = new Set(cartItems.map((i) => i.product_id));
    const availableProducts = candidates.filter(
      (p) => !cartProductIds.has(p.id),
    );

    // Score by popularity, with the cart category as the primary driver and a
    // secondary boost for categories the customer has purchased before.
    const scoreOf = (p: ProductWithPopularity): number =>
      p.timesOrdered +
      (p.category === primaryCategory
        ? CartService.PRIMARY_CATEGORY_WEIGHT
        : 0) +
      (purchasedCategories.has(p.category)
        ? CartService.PURCHASED_CATEGORY_WEIGHT
        : 0);

    // Sort by score (highest first) and pick top 3
    const suggestions = availableProducts
      .sort((a, b) => scoreOf(b) - scoreOf(a))
      .slice(0, 3);

    return suggestions;
  }
}
