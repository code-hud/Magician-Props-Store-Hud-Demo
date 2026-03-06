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
    const popularityByProductId = await this.getRecentOrderCounts(
      products.map((product) => product.id),
    );

    return products.map((product) => ({
      ...product,
      timesOrdered: popularityByProductId.get(product.id) || 0,
    }));
  }

  async findTopSuggestionsByCategory(
    category: string,
    excludedProductIds: number[],
    limit: number = 3,
  ): Promise<ProductWithPopularity[]> {
    const products = await this.productRepository.searchWithFilters('', category);
    const excludedIds = new Set(excludedProductIds);
    const availableProducts = products.filter((product) => !excludedIds.has(product.id));

    if (availableProducts.length === 0) return [];

    const popularityByProductId = await this.getRecentOrderCounts(
      availableProducts.map((product) => product.id),
    );

    return availableProducts
      .map((product) => ({
        ...product,
        timesOrdered: popularityByProductId.get(product.id) || 0,
      }))
      .sort((a, b) => b.timesOrdered - a.timesOrdered)
      .slice(0, limit);
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }

  private async getRecentOrderCounts(
    productIds: number[],
  ): Promise<Map<number, number>> {
    if (productIds.length === 0) {
      return new Map<number, number>();
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const groupedOrderCounts = await this.orderItemRepository
      .createQueryBuilder('order_item')
      .select('order_item.product_id', 'product_id')
      .addSelect('COUNT(*)', 'times_ordered')
      .where('order_item.product_id IN (:...productIds)', { productIds })
      .andWhere('order_item.created_at >= :oneWeekAgo', { oneWeekAgo })
      .groupBy('order_item.product_id')
      .getRawMany<{ product_id: string; times_ordered: string }>();

    return groupedOrderCounts.reduce((counts, row) => {
      counts.set(Number(row.product_id), Number(row.times_ordered));
      return counts;
    }, new Map<number, number>());
  }
}
