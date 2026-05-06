import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async findById(id: number): Promise<Product | null> {
    const product = await this.repository.findOne({
      where: { id },
    });
    console.log(`[ProductRepository] ${product ? 'Found' : 'Did not find'} product with id ${id}`);
    return product;
  }

  async searchWithFilters(search?: string, category?: string): Promise<Product[]> {
    const query = this.repository.createQueryBuilder('product');

    if (search) {
      query.where('product.name ILIKE :search', { search: `%${search}%` })
        .orWhere('product.description ILIKE :search', { search: `%${search}%` });
    }

    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    const products = await query.orderBy('product.created_at', 'DESC').getMany();
    console.log(`[ProductRepository] Search returned ${products.length} products (search: "${search}", category: "${category}")`);
    return products;
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.repository
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .where('product.category IS NOT NULL')
      .getRawMany();
    const result = categories.map(c => c.category).filter(Boolean);
    console.log(`[ProductRepository] Retrieved ${result.length} distinct categories`);
    return result;
  }
}
