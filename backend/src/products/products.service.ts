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
    if (products.length === 0) return [];

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Fetch recent order counts for all products in a single grouped query
    // rather than one count query per product.
    const orderCounts = await this.getOrderCounts(
      products.map((p) => p.id),
      oneDayAgo,
    );

    return products.map((product) => ({
      ...product,
      timesOrdered: orderCounts.get(product.id) ?? 0,
    }));
  }

  private async getOrderCounts(
    productIds: number[],
    since: Date,
  ): Promise<Map<number, number>> {
    if (productIds.length === 0) return new Map();

    const rows = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('item.product_id', 'productId')
      .addSelect('COUNT(*)', 'count')
      .where('item.product_id IN (:...productIds)', { productIds })
      .andWhere('item.created_at >= :since', { since })
      .groupBy('item.product_id')
      .getRawMany<{ productId: number; count: string }>();

    return new Map(rows.map((r) => [Number(r.productId), Number(r.count)]));
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }
}
