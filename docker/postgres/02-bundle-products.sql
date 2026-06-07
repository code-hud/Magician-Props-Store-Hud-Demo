CREATE TABLE product_bundle_items (
  id SERIAL PRIMARY KEY,
  bundle_product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_bundle_items_bundle ON product_bundle_items(bundle_product_id);

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
    'Collection of 120 silk scarves and accessories.',
    199.99,
    'Bundle',
    80
  ),
  (
    5008,
    'Wand Kit Bundle',
    'Collection of 120 wands and holders.',
    129.99,
    'Bundle',
    100
  );

INSERT INTO product_bundle_items (bundle_product_id, component_product_id, sort_order)
VALUES
  (5001, 5003, 1),
  (5001, 5004, 2),
  (5002, 5, 1),
  (5002, 6, 2),
  (5003, 5005, 1),
  (5003, 5006, 2),
  (5004, 5005, 1),
  (5004, 5006, 2);

INSERT INTO product_bundle_items (bundle_product_id, component_product_id, sort_order)
SELECT
  bundle_id,
  component_id,
  row_number() OVER (PARTITION BY bundle_id ORDER BY rep, pos) AS sort_order
FROM (VALUES (5005), (5006)) AS wings(bundle_id),
     generate_series(0, 7) AS rep,
     generate_series(1, 2) AS pos
JOIN LATERAL (VALUES (1, 5007), (2, 5008)) AS components(pos, component_id) USING (pos);

INSERT INTO product_bundle_items (bundle_product_id, component_product_id, sort_order)
SELECT 5007, g, g FROM generate_series(1, 120) AS g;

INSERT INTO product_bundle_items (bundle_product_id, component_product_id, sort_order)
SELECT 5008, g, g - 120 FROM generate_series(121, 240) AS g;

SELECT setval(
    pg_get_serial_sequence('products', 'id'),
    (SELECT MAX(id) FROM products)
  );
