import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  deserializeOrderCreatedEvent,
  OrderCreatedEventWire,
} from './order-events.codec';
import { OrderInsightsService } from './order-insights.service';
import { ORDERS_CREATED_TOPIC } from './order-events.types';

@Controller()
export class OrderEventsController {
  constructor(private readonly orderInsightsService: OrderInsightsService) {}

  @EventPattern(ORDERS_CREATED_TOPIC)
  async handleOrderCreated(@Payload() wire: OrderCreatedEventWire): Promise<void> {
    const event = deserializeOrderCreatedEvent(wire);
    await this.orderInsightsService.computeOrderInsights(event);
  }
}
