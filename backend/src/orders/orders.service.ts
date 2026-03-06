import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { Order } from './entities/order.entity';
import { OrderRepository } from './repositories/order.repository';
import { CartRepository } from '../cart/repositories/cart.repository';

@Injectable()
export class OrdersService {
  private readonly checkoutServiceUrl =
    process.env.CHECKOUT_SERVICE_URL || 'http://localhost:3002';

  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: CartRepository,
  ) {}

  private async processCheckout(
    sessionId: string,
    totalAmount: number,
    items: { productId: number; quantity: number; price: number }[],
  ): Promise<void> {
    try {
      const response = await axios.post(`${this.checkoutServiceUrl}/checkout`, {
        sessionId,
        totalAmount,
        items,
      });

      if (!response.data?.success) {
        throw new HttpException(
          {
            error: response.data?.decision || 'Checkout rejected',
            message: response.data?.fraud?.message || response.data?.issue || 'Checkout was not approved',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response) {
        throw new HttpException(
          {
            error: error.response.data?.error || 'Checkout failed',
            message: error.response.data?.message || 'Checkout service returned an error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw error;
    }
  }

  async createOrder(
    sessionId: string,
    customerName: string,
    customerEmail: string,
    customerPhone: string,
    totalAmount: number,
    items: { productId: number; quantity: number; price: number }[],
  ): Promise<Order> {
    // Process checkout through external service
    await this.processCheckout(sessionId, totalAmount, items);

    // Create order
    const savedOrder = await this.orderRepository.createOrder(
      sessionId,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
    );

    // Create order items
    for (const item of items) {
      await this.orderRepository.addOrderItem(
        savedOrder.id,
        item.productId,
        item.quantity,
        item.price,
      );
    }

    // Clear cart
    await this.cartRepository.clearCart(sessionId);

    return this.orderRepository.findById(savedOrder.id);
  }

  async getOrderHistory(sessionId: string): Promise<Order[]> {
    return this.orderRepository.findBySessionId(sessionId);
  }

  async getOrder(id: number): Promise<Order> {
    return this.orderRepository.findById(id);
  }
}
