import { ProductsService } from '../src/products/products.service';

describe('ProductsService.findAll', () => {
  let service: ProductsService;
  const productRepository = { searchWithFilters: jest.fn() };

  // Chainable query-builder stub; getRawMany resolves the grouped rows.
  const rawRows: Array<{ productId: number; count: string }> = [];
  const queryBuilder: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(async () => rawRows),
  };
  const orderItemRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    rawRows.length = 0;
    service = new ProductsService(
      productRepository as any,
      orderItemRepository as any,
    );
  });

  it('annotates products with recent order counts using a single grouped query', async () => {
    productRepository.searchWithFilters.mockResolvedValue([
      { id: 1, category: 'cards' },
      { id: 2, category: 'cards' },
      { id: 3, category: 'cards' },
    ]);
    // Only products 1 and 3 have recent orders; 2 should default to 0.
    rawRows.push({ productId: 1, count: '5' }, { productId: 3, count: '2' });

    const result = await service.findAll('', 'cards');

    expect(result.map((p) => [p.id, p.timesOrdered])).toEqual([
      [1, 5],
      [2, 0],
      [3, 2],
    ]);
    // The whole popularity lookup is one query, not one per product.
    expect(orderItemRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
  });

  it('short-circuits without querying order items when no products match', async () => {
    productRepository.searchWithFilters.mockResolvedValue([]);

    const result = await service.findAll('', 'nonexistent');

    expect(result).toEqual([]);
    expect(orderItemRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
