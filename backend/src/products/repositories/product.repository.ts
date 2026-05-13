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

  async findAll(): Promise<Product[]> {
    const products = await this.repository.find({
      order: { created_at: 'DESC' },
    });
    console.log(`[ProductRepository] Retrieved ${products.length} products`);
    return products;
  }

  async findById(id: number): Promise<Product | null> {
    const product = await this.repository.findOne({
      where: { id },
    });
    console.log(`[ProductRepository] ${product ? 'Found' : 'Did not find'} product with id ${id}`);
    return product;
  }

  async findByIds(ids: number[]): Promise<Product[]> {
    const products = await this.repository.findByIds(ids);
    console.log(`[ProductRepository] Retrieved ${products.length} of ${ids.length} products`);
    return products;
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

  async searchWithFiltersAndPopularity(
    search: string | undefined,
    category: string | undefined,
    since: Date,
  ): Promise<(Product & { timesOrdered: number })[]> {
    const query = this.repository
      .createQueryBuilder('product')
      .leftJoin(
        'order_items',
        'oi',
        'oi.product_id = product.id AND oi.created_at >= :since',
        { since },
      )
      .addSelect('COUNT(oi.id)::int', 'timesOrdered')
      .groupBy('product.id')
      .orderBy('product.created_at', 'DESC');

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    const { entities, raw } = await query.getRawAndEntities<{ timesOrdered: string | number }>();
    return entities.map((entity, i) => ({
      ...entity,
      timesOrdered: Number(raw[i]?.timesOrdered ?? 0) || 0,
    }));
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
