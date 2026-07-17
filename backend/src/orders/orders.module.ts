import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { OrderRepository } from './repositories/order.repository';
import { CartRepository } from '../cart/repositories/cart.repository';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, CartItem]), PromotionsModule],
  controllers: [OrdersController],
  providers: [OrderRepository, CartRepository, OrdersService],
  exports: [OrdersService, OrderRepository],
})
export class OrdersModule {}
