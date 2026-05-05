import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductRepository, ProductsService],
  exports: [ProductsService, ProductRepository],
})
export class ProductsModule {}
