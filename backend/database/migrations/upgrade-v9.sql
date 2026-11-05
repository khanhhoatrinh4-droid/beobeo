USE fastfood_db;

ALTER TABLE order_details
    ADD COLUMN IF NOT EXISTS customizations VARCHAR(500) NULL;
