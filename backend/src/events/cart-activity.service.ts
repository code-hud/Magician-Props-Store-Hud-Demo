import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../products/repositories/product.repository';
import { CartClearedEvent, CartItemAddedEvent } from './cart-events.types';

@Injectable()
export class CartActivityService {
  constructor(private readonly productRepository: ProductRepository) {}

  async handleItemAdded(event: CartItemAddedEvent): Promise<void> {
    const product = await this.productRepository.findById(event.productId);
    const label = product?.name ?? `product ${event.productId}`;

    console.log(
      `[CartActivity] item added: ${label} x${event.quantity} (session: ${event.sessionId})`,
    );
  }

  async handleCartCleared(event: CartClearedEvent): Promise<void> {
    console.log(
      `[CartActivity] cart cleared: ${event.itemCount} line(s) (session: ${event.sessionId})`,
    );
  }
}
