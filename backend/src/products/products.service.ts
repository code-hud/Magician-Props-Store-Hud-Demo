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

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const productIds = products.map((product) => product.id);
    const popularityRows = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('orderItem.product_id', 'productId')
      .addSelect('COUNT(orderItem.id)', 'timesOrdered')
      .where('orderItem.product_id IN (:...productIds)', { productIds })
      .andWhere('orderItem.created_at >= :oneWeekAgo', { oneWeekAgo })
      .groupBy('orderItem.product_id')
      .getRawMany<{ productId: string; timesOrdered: string }>();

    const popularityByProductId = new Map<number, number>(
      popularityRows.map((row) => [Number(row.productId), Number(row.timesOrdered)]),
    );

    return products.map((product) => ({
      ...product,
      timesOrdered: popularityByProductId.get(product.id) ?? 0,
    }));
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }
}
