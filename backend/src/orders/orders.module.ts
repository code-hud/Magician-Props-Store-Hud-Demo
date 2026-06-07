import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { OrderRepository } from './repositories/order.repository';
import { CartRepository } from '../cart/repositories/cart.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, CartItem]), EventsModule],
  controllers: [OrdersController],
  providers: [OrderRepository, CartRepository, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
