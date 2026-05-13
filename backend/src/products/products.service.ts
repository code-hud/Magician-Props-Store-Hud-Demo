import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';

export interface ProductWithPopularity extends Product {
  timesOrdered: number;
}

@Injectable()
export class ProductsService {
  constructor(private productRepository: ProductRepository) {}

  async findAll(search?: string, category?: string): Promise<ProductWithPopularity[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.productRepository.searchWithFiltersAndPopularity(
      search,
      category,
      oneWeekAgo,
    );
  }

  async findOne(id: number): Promise<Product> {
    return this.productRepository.findById(id);
  }

  async getCategories(): Promise<string[]> {
    return this.productRepository.getCategories();
  }
}
