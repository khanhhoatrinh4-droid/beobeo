-- Chạy file này một lần nếu bạn đã tạo fastfood_db bằng schema phiên bản cũ.
USE fastfood_db;

ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(12,2) NULL AFTER price;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INT NOT NULL DEFAULT 0 AFTER original_price;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE AFTER discount_percent;
ALTER TABLE products ADD COLUMN IF NOT EXISTS combo_product BOOLEAN NOT NULL DEFAULT FALSE AFTER featured;

UPDATE products SET active = TRUE WHERE active IS NULL OR active = FALSE;
UPDATE products SET discount_percent = 0 WHERE discount_percent IS NULL;
UPDATE products SET featured = FALSE WHERE featured IS NULL;
UPDATE products SET combo_product = FALSE WHERE combo_product IS NULL;
ALTER TABLE products MODIFY discount_percent INT NOT NULL DEFAULT 0,
                     MODIFY featured BOOLEAN NOT NULL DEFAULT FALSE,
                     MODIFY combo_product BOOLEAN NOT NULL DEFAULT FALSE;

-- Ví dụ gắn nhãn nội dung cho dữ liệu cũ.
UPDATE products SET featured = TRUE WHERE name IN ('Classic Burger', 'Crispy Chicken');
UPDATE products SET combo_product = TRUE, featured = TRUE, original_price = 89000, discount_percent = 16
WHERE name = 'Burger Combo';
