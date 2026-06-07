import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductBundleItem } from './entities/product-bundle-item.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { BundleRepository } from './repositories/bundle.repository';
import { ProductRepository } from './repositories/product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductBundleItem, OrderItem])],
  controllers: [ProductsController],
  providers: [ProductRepository, BundleRepository, ProductsService],
  exports: [ProductsService, ProductRepository, BundleRepository],
})
export class ProductsModule {}
