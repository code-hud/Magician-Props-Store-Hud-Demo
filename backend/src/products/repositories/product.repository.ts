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

  async findTopByPopularityInCategory(
    category: string,
    excludeProductIds: number[],
    since: Date,
    limit: number,
  ): Promise<(Product & { timesOrdered: number })[]> {
    const qb = this.repository.createQueryBuilder('product')
      .addSelect(
        'COALESCE(popularity.times_ordered, 0)',
        'timesOrdered',
      )
      .leftJoin(
        subQuery => subQuery
          .select('oi.product_id', 'product_id')
          .addSelect('COUNT(*)::int', 'times_ordered')
          .from('order_items', 'oi')
          .where('oi.created_at >= :since', { since })
          .groupBy('oi.product_id'),
        'popularity',
        'popularity.product_id = product.id',
      )
      .where('product.category = :category', { category });

    if (excludeProductIds.length > 0) {
      qb.andWhere('product.id NOT IN (:...excludeProductIds)', { excludeProductIds });
    }

    qb.orderBy('COALESCE(popularity.times_ordered, 0)', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .limit(limit);

    const { entities, raw } = await qb.getRawAndEntities();
    return entities.map((entity, i) => ({
      ...entity,
      timesOrdered: parseInt(raw[i].timesOrdered, 10) || 0,
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
