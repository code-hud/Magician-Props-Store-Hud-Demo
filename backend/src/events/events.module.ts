import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { CartActivityService } from './cart-activity.service';
import { KafkaEventsController } from './kafka-events.controller';
import { KafkaEventsProducer } from './kafka-events.producer';
import { OrderInsightsService } from './order-insights.service';

@Module({
  imports: [ProductsModule],
  controllers: [KafkaEventsController],
  providers: [KafkaEventsProducer, CartActivityService, OrderInsightsService],
  exports: [KafkaEventsProducer],
})
export class EventsModule {}
