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

    const productIds = products.map(p => p.id);

    const orderCounts = await this.orderItemRepository
      .createQueryBuilder('order_item')
      .select('order_item.product_id', 'product_id')
      .addSelect('COUNT(*)', 'count')
      .where('order_item.product_id IN (:...productIds)', { productIds })
      .andWhere('order_item.created_at >= :oneWeekAgo', { oneWeekAgo })
      .groupBy('order_item.product_id')
      .getRawMany();

    const orderCountMap = new Map<number, number>();
    orderCounts.forEach((row) => {
      orderCountMap.set(Number(row.product_id), Number(row.count));
    });

    const productsWithPopularity: ProductWithPopularity[] = products.map(product => ({
      ...product,
      timesOrdered: orderCountMap.get(product.id) || 0,
    }));

    return productsWithPopularity;
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }
}
