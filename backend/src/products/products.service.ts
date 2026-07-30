import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    if (products.length === 0) {
      return [];
    }

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const productIds = products.map((p) => p.id);
    const orderCounts = await this.orderItemRepository
      .createQueryBuilder('oi')
      .select('oi.product_id', 'productId')
      .addSelect('COUNT(*)', 'count')
      .where('oi.created_at >= :since', { since: oneDayAgo })
      .andWhere('oi.product_id IN (:...productIds)', { productIds })
      .groupBy('oi.product_id')
      .getRawMany<{ productId: number; count: string }>();

    const countMap = new Map(
      orderCounts.map((r) => [r.productId, parseInt(r.count, 10)]),
    );

    return products.map((product) => ({
      ...product,
      timesOrdered: countMap.get(product.id) ?? 0,
    }));
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }
}
