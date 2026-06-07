INSERT INTO products (id, name, description, price, category, stock)
VALUES (
    5001,
    'Master Illusionist''s Vault',
    'Complete professional bundle with nested silk and wand kits.',
    2499.99,
    'Bundle',
    12
  ),
  (
    5002,
    'Beginner''s Trick Kit',
    'Starter bundle with two essential props.',
    49.99,
    'Bundle',
    200
  ),
  (
    5003,
    'Grand Performance Kit',
    'Mid-tier bundle with alpha and beta wing assemblies.',
    899.99,
    'Bundle',
    40
  ),
  (
    5004,
    'Professional Accessories Kit',
    'Companion bundle with wing assemblies and accessories.',
    749.99,
    'Bundle',
    35
  ),
  (
    5005,
    'Alpha Wing Assembly',
    'Stage-left assembly with silk and wand sub-kits.',
    349.99,
    'Bundle',
    50
  ),
  (
    5006,
    'Beta Wing Assembly',
    'Stage-right assembly with silk and wand sub-kits.',
    349.99,
    'Bundle',
    50
  ),
  (
    5007,
    'Silk Kit Bundle',
    'Collection of forty silk scarves and accessories.',
    199.99,
    'Bundle',
    80
  ),
  (
    5008,
    'Wand Kit Bundle',
    'Collection of forty wands and holders.',
    129.99,
    'Bundle',
    100
  );
SELECT setval(
    pg_get_serial_sequence('products', 'id'),
    (
      SELECT MAX(id)
      FROM products
    )
  );