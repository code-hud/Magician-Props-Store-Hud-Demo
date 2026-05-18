import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(CartItem)
    private readonly repository: Repository<CartItem>,
  ) {}

  async findBySessionId(sessionId: string): Promise<CartItem[]> {
    const items = await this.repository.find({
      where: { session_id: sessionId },
    });
    console.log(`[CartRepository] Found ${items.length} items in cart for session ${sessionId}`);
    return items;
  }

  async findItem(sessionId: string, productId: number): Promise<CartItem | null> {
    const item = await this.repository.findOne({
      where: { session_id: sessionId, product_id: productId },
    });
    console.log(`[CartRepository] ${item ? 'Found' : 'Did not find'} cart item for product ${productId} in session ${sessionId}`);
    return item;
  }

  async addItem(
    sessionId: string,
    productId: number,
    quantity: number,
  ): Promise<CartItem> {
    const item = this.repository.create({
      session_id: sessionId,
      product_id: productId,
      quantity,
    });
    const saved = await this.repository.save(item);
    console.log(`[CartRepository] Added item (product ${productId}, qty ${quantity}) to cart for session ${sessionId}`);
    return saved;
  }

  async updateQuantity(
    sessionId: string,
    productId: number,
    quantity: number,
  ): Promise<CartItem> {
    const item = await this.findItem(sessionId, productId);
    if (!item) {
      throw new Error('Cart item not found');
    }
    item.quantity = quantity;
    console.log(`[CartRepository] Updated quantity to ${quantity} for product ${productId} in session ${sessionId}`);
    const saved = await this.repository.save(item);
    return saved;
  }

  async removeItem(sessionId: string, productId: number): Promise<void> {
    await this.repository.delete({
      session_id: sessionId,
      product_id: productId,
    });
    console.log(`[CartRepository] Removed product ${productId} from cart for session ${sessionId}`);
  }

  async clearCart(sessionId: string): Promise<void> {
    await this.repository.delete({ session_id: sessionId });
    console.log(`[CartRepository] Cleared entire cart for session ${sessionId}`);
  }
}
