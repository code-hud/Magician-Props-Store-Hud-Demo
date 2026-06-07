import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('product_bundle_items')
export class ProductBundleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bundle_product_id: number;

  @Column()
  component_product_id: number;

  @Column({ default: 0 })
  sort_order: number;
}
