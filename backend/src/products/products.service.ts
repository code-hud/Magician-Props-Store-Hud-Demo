import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductRepository } from './repositories/product.repository';

export interface ProductWithPopularity extends Product {
  timesOrdered: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private productRepository: ProductRepository,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  async findAll(search?: string, category?: string): Promise<ProductWithPopularity[]> {
    const products = await this.productRepository.searchWithFilters(search, category);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const productsWithPopularity: ProductWithPopularity[] = [];
    for (const product of products) {
      const orderCount = await this.orderItemRepository.count({
        where: {
          product_id: product.id,
          created_at: MoreThanOrEqual(oneWeekAgo),
        }
      });

      productsWithPopularity.push({
        ...product,
        timesOrdered: orderCount,
      });
    }

    return productsWithPopularity;
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }
}
