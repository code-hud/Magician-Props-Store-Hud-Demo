import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';

export interface ProductWithPopularity extends Product {
  timesOrdered: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private productRepository: ProductRepository,
  ) {}

  async findAll(search?: string, category?: string): Promise<Product[]> {
    return this.productRepository.searchWithFilters(search, category);
  }

  async findPopularByCategory(
    category: string,
    excludeProductIds: number[],
    since: Date,
    limit: number,
  ): Promise<ProductWithPopularity[]> {
    return this.productRepository.findTopByPopularityInCategory(
      category,
      excludeProductIds,
      since,
      limit,
    );
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }
}
