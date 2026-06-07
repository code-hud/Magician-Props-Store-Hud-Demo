import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { OrderEventsController } from './order-events.controller';
import { OrderEventsProducer } from './order-events.producer';
import { OrderInsightsService } from './order-insights.service';

@Module({
  imports: [ProductsModule],
  controllers: [OrderEventsController],
  providers: [OrderEventsProducer, OrderInsightsService],
  exports: [OrderEventsProducer],
})
export class EventsModule {}
