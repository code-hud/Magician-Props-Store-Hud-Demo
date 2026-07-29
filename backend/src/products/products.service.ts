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

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const productsWithPopularity: ProductWithPopularity[] = [];
    for (const product of products) {
      const orderCount = await this.getProductOrderCount(product.id, oneDayAgo);

      productsWithPopularity.push({
        ...product,
        timesOrdered: orderCount,
      });
    }

    return productsWithPopularity;
  }

  private async getProductOrderCount(productId: number, since: Date): Promise<number> {
    return this.orderItemRepository.count({
      where: {
        product_id: productId,
        created_at: MoreThanOrEqual(since),
      }
    });
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }
}
