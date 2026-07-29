import { CartService } from '../src/cart/cart.service';
import { ProductWithPopularity } from '../src/products/products.service';

// Lightweight builders so each test only states the fields it cares about.
const cartItem = (productId: number, category: string, quantity = 1) => ({
  product_id: productId,
  quantity,
  product: { id: productId, category },
});

const product = (
  id: number,
  category: string,
  timesOrdered: number,
): ProductWithPopularity =>
  ({ id, category, timesOrdered } as unknown as ProductWithPopularity);

const orderWithItems = (...categories: string[]) => ({
  items: categories.map((category, i) => ({
    product: { id: 1000 + i, category },
  })),
});

describe('CartService.getSuggestions', () => {
  let service: CartService;
  const cartRepository = { findBySessionId: jest.fn() };
  const productsService = { findAll: jest.fn() };
  const orderRepository = { findBySessionId: jest.fn() };

  // findAll is called once per candidate category; resolve from a per-category map.
  const stubCatalog = (byCategory: Record<string, ProductWithPopularity[]>) => {
    productsService.findAll.mockImplementation(
      async (_search: string, category: string) => byCategory[category] ?? [],
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    orderRepository.findBySessionId.mockResolvedValue([]);
    service = new CartService(
      cartRepository as any,
      productsService as any,
      orderRepository as any,
    );
  });

  it('returns nothing for an empty cart without touching products or orders', async () => {
    cartRepository.findBySessionId.mockResolvedValue([]);

    const suggestions = await service.getSuggestions('s1');

    expect(suggestions).toEqual([]);
    expect(productsService.findAll).not.toHaveBeenCalled();
    expect(orderRepository.findBySessionId).not.toHaveBeenCalled();
  });

  it('returns nothing when cart items have no resolvable category', async () => {
    cartRepository.findBySessionId.mockResolvedValue([
      { product_id: 1, quantity: 1, product: {} },
    ]);

    const suggestions = await service.getSuggestions('s1');

    expect(suggestions).toEqual([]);
    expect(productsService.findAll).not.toHaveBeenCalled();
  });

  it('ranks the cart primary category above purchased categories and caps at 3', async () => {
    // Cart is mostly "cards" (primary) with one "coins" item.
    cartRepository.findBySessionId.mockResolvedValue([
      cartItem(1, 'cards'),
      cartItem(2, 'cards'),
      cartItem(3, 'coins'),
    ]);
    // History adds two purchased categories: coins and silks.
    orderRepository.findBySessionId.mockResolvedValue([
      orderWithItems('coins', 'silks'),
    ]);
    stubCatalog({
      cards: [product(10, 'cards', 5), product(11, 'cards', 1)],
      coins: [product(20, 'coins', 50)],
      silks: [product(30, 'silks', 2)],
    });

    const suggestions = await service.getSuggestions('s1');

    // Scores: 10 -> 5+2000, 11 -> 1+2000, 20 -> 50+1000, 30 -> 2+1000.
    // Primary-category items win even though the coins item is far more popular.
    expect(suggestions.map((p) => p.id)).toEqual([10, 11, 20]);
    // Candidate pool = primary + purchased categories.
    expect(productsService.findAll.mock.calls.map((c) => c[1])).toEqual([
      'cards',
      'coins',
      'silks',
    ]);
  });

  it('lets past orders surface products from categories not in the cart', async () => {
    cartRepository.findBySessionId.mockResolvedValue([cartItem(1, 'cards')]);
    stubCatalog({
      cards: [product(10, 'cards', 0)],
      coins: [product(20, 'coins', 100)],
    });

    // Without history, only the primary category is a candidate.
    const withoutHistory = await service.getSuggestions('s1');
    expect(withoutHistory.map((p) => p.id)).toEqual([10]);
    expect(productsService.findAll).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    stubCatalog({
      cards: [product(10, 'cards', 0)],
      coins: [product(20, 'coins', 100)],
    });
    orderRepository.findBySessionId.mockResolvedValue([orderWithItems('coins')]);

    // With a coins purchase in history, coins products become eligible.
    const withHistory = await service.getSuggestions('s1');
    expect(withHistory.map((p) => p.id)).toEqual([10, 20]);
  });

  it('excludes products already in the cart', async () => {
    cartRepository.findBySessionId.mockResolvedValue([
      cartItem(10, 'cards'),
      cartItem(11, 'cards'),
    ]);
    stubCatalog({
      cards: [product(10, 'cards', 99), product(12, 'cards', 1)],
    });

    const suggestions = await service.getSuggestions('s1');

    // Product 10 is in the cart and must not be suggested despite its popularity.
    expect(suggestions.map((p) => p.id)).toEqual([12]);
  });

  it('de-duplicates a product that appears in multiple candidate categories', async () => {
    cartRepository.findBySessionId.mockResolvedValue([cartItem(1, 'cards')]);
    orderRepository.findBySessionId.mockResolvedValue([orderWithItems('coins')]);
    const shared = product(20, 'cards', 3);
    stubCatalog({
      cards: [shared],
      coins: [shared],
    });

    const suggestions = await service.getSuggestions('s1');

    expect(suggestions.map((p) => p.id)).toEqual([20]);
    expect(suggestions).toHaveLength(1);
  });

  it('applies both the primary and purchased boosts when the cart category was also purchased', async () => {
    cartRepository.findBySessionId.mockResolvedValue([cartItem(1, 'cards')]);
    // "cards" is both the cart primary category and a previously purchased one.
    orderRepository.findBySessionId.mockResolvedValue([orderWithItems('cards')]);
    stubCatalog({
      cards: [product(10, 'cards', 0)],
    });

    const suggestions = await service.getSuggestions('s1');

    // 10 -> 0 + 2000 (primary) + 1000 (purchased) = 3000; still returned first.
    expect(suggestions.map((p) => p.id)).toEqual([10]);
  });
});
