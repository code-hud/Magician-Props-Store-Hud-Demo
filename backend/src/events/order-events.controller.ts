import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderInsightsService } from './order-insights.service';
import { OrderCreatedEvent, ORDERS_CREATED_TOPIC } from './order-events.types';

@Controller()
export class OrderEventsController {
  constructor(private readonly orderInsightsService: OrderInsightsService) {}

  @EventPattern(ORDERS_CREATED_TOPIC)
  async handleOrderCreated(@Payload() event: OrderCreatedEvent): Promise<void> {
    await this.orderInsightsService.computeOrderInsights(event);
  }
}
