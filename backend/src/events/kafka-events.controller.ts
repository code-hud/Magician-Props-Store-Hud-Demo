import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CartActivityService } from './cart-activity.service';
import {
  CartClearedEvent,
  CartItemAddedEvent,
  CART_CLEARED_TOPIC,
  CART_ITEM_ADDED_TOPIC,
} from './cart-events.types';
import {
  deserializeOrderCreatedEvent,
  OrderCreatedEventWire,
} from './order-events.codec';
import { OrderInsightsService } from './order-insights.service';
import { ORDERS_CREATED_TOPIC } from './order-events.types';

@Controller()
export class KafkaEventsController {
  constructor(
    private readonly cartActivityService: CartActivityService,
    private readonly orderInsightsService: OrderInsightsService,
  ) {}

  @EventPattern(CART_ITEM_ADDED_TOPIC)
  async handleCartItemAdded(@Payload() event: CartItemAddedEvent): Promise<void> {
    await this.cartActivityService.handleItemAdded(event);
  }

  @EventPattern(CART_CLEARED_TOPIC)
  async handleCartCleared(@Payload() event: CartClearedEvent): Promise<void> {
    await this.cartActivityService.handleCartCleared(event);
  }

  @EventPattern(ORDERS_CREATED_TOPIC)
  async handleOrderCreated(@Payload() wire: OrderCreatedEventWire): Promise<void> {
    const event = deserializeOrderCreatedEvent(wire);
    await this.orderInsightsService.computeOrderInsights(event);
  }
}
