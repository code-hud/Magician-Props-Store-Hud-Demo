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

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const orderCounts = await this.getProductOrderCounts(
      products.map((product) => product.id),
      oneDayAgo,
    );

    return products.map((product) => ({
      ...product,
      timesOrdered: orderCounts.get(product.id) ?? 0,
    }));
  }

  private async getProductOrderCounts(
    productIds: number[],
    since: Date,
  ): Promise<Map<number, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const rows = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('orderItem.product_id', 'productId')
      .addSelect('COUNT(orderItem.id)', 'orderCount')
      .where('orderItem.product_id IN (:...productIds)', { productIds })
      .andWhere('orderItem.created_at >= :since', { since })
      .groupBy('orderItem.product_id')
      .getRawMany<{ productId: string | number; orderCount: string }>();

    return new Map(
      rows.map((row) => [Number(row.productId), Number(row.orderCount)]),
    );
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }
}
