-- Nạp nội dung hiển thị cho website FASTY. An toàn để chạy lại: không xóa dữ liệu cũ.
USE fastfood_db;

-- Các món cũ trong dữ liệu ban đầu chưa có cờ hoạt động; bật để website có thể hiển thị.
UPDATE products SET active = TRUE WHERE active IS NULL OR active = FALSE;

INSERT INTO categories (name, description, active)
SELECT 'Combo', 'Các phần ăn tiết kiệm', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Combo');

-- Bổ sung ảnh, giá khuyến mãi và nhãn nổi bật cho các món sẵn có.
UPDATE products SET
    description = 'Bò nướng thơm mềm, phô mai cheddar và rau xanh tươi giòn.',
    price = 59000, original_price = 69000, discount_percent = 14, featured = TRUE,
    image_url = '/images/hero-burger.jpg'
WHERE name = 'Burger Bò Phô Mai';

UPDATE products SET
    description = 'Burger gà giòn vàng, sốt đặc biệt và rau tươi.',
    price = 45000, original_price = 55000, discount_percent = 18, featured = TRUE,
    image_url = '/images/burger-chicken.jpg'
WHERE name = 'Burger Gà';

UPDATE products SET
    description = 'Gà chiên giòn rụm, đậm vị, nóng hổi mỗi ngày.',
    price = 49000, original_price = 59000, discount_percent = 17, featured = TRUE,
    image_url = '/images/fried-chicken.jpg'
WHERE name = 'Gà Rán Giòn';

UPDATE products SET
    description = 'Khoai tây vàng giòn, dùng kèm tương cà đặc biệt.',
    price = 29000, original_price = NULL, discount_percent = 0, featured = TRUE,
    image_url = '/images/fries.jpg'
WHERE name = 'Khoai Tây Chiên';

UPDATE products SET
    description = 'Nước ngọt có ga mát lạnh, giải khát tức thì.',
    price = 15000, original_price = NULL, discount_percent = 0, featured = FALSE,
    image_url = '/images/coca-cola.jpg'
WHERE name = 'Coca Cola';

INSERT INTO products (name, description, price, original_price, discount_percent, featured, combo_product, image_url, active, category_id)
SELECT 'Combo No Nê 2 Người', '2 burger bò, 2 miếng gà giòn, khoai lớn và 2 Coca Cola.', 159000, 209000, 24, TRUE, TRUE,
       '/images/combo-two.jpg', TRUE, id
FROM categories WHERE name = 'Combo'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Combo No Nê 2 Người');

INSERT INTO products (name, description, price, original_price, discount_percent, featured, combo_product, image_url, active, category_id)
SELECT 'Combo Gia Đình Vui Vẻ', '4 miếng gà, 2 burger, khoai lớn và 4 nước ngọt cho cả nhà.', 249000, 319000, 22, TRUE, TRUE,
       '/images/combo-family.jpg', TRUE, id
FROM categories WHERE name = 'Combo'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Combo Gia Đình Vui Vẻ');

INSERT INTO products (name, description, price, original_price, discount_percent, featured, combo_product, image_url, active, category_id)
SELECT 'Combo Gà Bạn Bè', '6 miếng gà giòn, khoai lắc phô mai và 3 nước ngọt.', 199000, 259000, 23, TRUE, TRUE,
       '/images/combo-chicken.jpg', TRUE, id
FROM categories WHERE name = 'Combo'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Combo Gà Bạn Bè');
