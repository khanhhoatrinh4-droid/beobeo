USE fastfood_db;

-- Allow new Java PaymentMethod enum values without a database ENUM allowlist.
ALTER TABLE orders
    MODIFY COLUMN payment_method VARCHAR(30) NOT NULL;
