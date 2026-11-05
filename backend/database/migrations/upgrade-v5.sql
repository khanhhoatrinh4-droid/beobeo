USE fastfood_db;

-- Keep compatibility with databases created from the earlier order_details schema.
ALTER TABLE order_details ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) NULL;
UPDATE order_details SET price = unit_price WHERE price IS NULL;
ALTER TABLE order_details MODIFY price DECIMAL(12,2) NOT NULL;
