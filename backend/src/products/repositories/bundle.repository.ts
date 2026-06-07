import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductBundleItem } from '../entities/product-bundle-item.entity';

@Injectable()
export class BundleRepository {
  constructor(
    @InjectRepository(ProductBundleItem)
    private readonly repository: Repository<ProductBundleItem>,
  ) {}

  async hasComponents(bundleProductId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: { bundle_product_id: bundleProductId },
    });
    return count > 0;
  }

  async findComponentIds(bundleProductId: number): Promise<number[]> {
    const rows = await this.repository.find({
      where: { bundle_product_id: bundleProductId },
      order: { sort_order: 'ASC' },
      select: ['component_product_id'],
    });
    return rows.map((row) => row.component_product_id);
  }
}
