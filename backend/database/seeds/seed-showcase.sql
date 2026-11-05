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
    image_url = '/images/hero-burger.jpg',
    ingredients = 'Bò nướng, phô mai cheddar, xà lách, cà chua, dưa chuột muối, sốt burger'
WHERE name = 'Burger Bò Phô Mai';

UPDATE products SET
    description = 'Burger gà giòn vàng, sốt đặc biệt và rau tươi.',
    price = 45000, original_price = 55000, discount_percent = 18, featured = TRUE,
    image_url = '/images/burger-chicken.jpg',
    ingredients = 'Gà giòn, phô mai cheddar, xà lách, cà chua, dưa chuột muối, sốt gà'
WHERE name = 'Burger Gà';

UPDATE products SET
    description = 'Gà chiên giòn rụm, đậm vị, nóng hổi mỗi ngày.',
    price = 49000, original_price = 59000, discount_percent = 17, featured = TRUE,
    image_url = '/images/fried-chicken.jpg',
    ingredients = 'Thịt gà, bột chiên giòn, sốt cay'
WHERE name = 'Gà Rán Giòn';

UPDATE products SET
    description = 'Khoai tây vàng giòn, dùng kèm tương cà đặc biệt.',
    price = 29000, original_price = NULL, discount_percent = 0, featured = TRUE,
    image_url = '/images/fries.jpg',
    ingredients = 'Khoai tây, phô mai cheddar, tương cà'
WHERE name = 'Khoai Tây Chiên';

UPDATE products SET
    description = 'Nước ngọt có ga mát lạnh, giải khát tức thì.',
    price = 15000, original_price = NULL, discount_percent = 0, featured = FALSE,
    image_url = '/images/coca-cola.jpg'
WHERE name = 'Coca Cola';

-- Thực đơn đồ uống bổ sung; chạy lại seed không tạo sản phẩm trùng tên.
-- Nap rieng backend/database/seeds/seed-drinks.sql bang mysql --default-character-set=utf8mb4.

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

-- Combo chủ đề Halloween, có thể dùng lặp lại mà không tạo bản trùng.
INSERT INTO products (name, description, price, original_price, discount_percent, featured, combo_product, image_url, active, category_id)
SELECT 'Combo Bí Ngô Ma Thuật', '2 burger bò, 2 gà rán giòn, khoai tây lớn và 2 Coca Cola — bữa tiệc Halloween cho đôi bạn.', 179000, 229000, 22, TRUE, TRUE,
       '/images/combo-two.jpg', TRUE, id
FROM categories WHERE name = 'Combo'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Combo Bí Ngô Ma Thuật');

INSERT INTO products (name, description, price, original_price, discount_percent, featured, combo_product, image_url, active, category_id)
SELECT 'Combo Hội Ma Bạn Bè', '4 burger gà, 4 miếng gà rán, khoai lớn và 4 nước ngọt — đủ món cho hội bạn cùng nhập tiệc.', 299000, 389000, 23, TRUE, TRUE,
       '/images/combo-chicken.jpg', TRUE, id
FROM categories WHERE name = 'Combo'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Combo Hội Ma Bạn Bè');

INSERT INTO products (name, description, price, original_price, discount_percent, featured, combo_product, image_url, active, category_id)
SELECT 'Combo Đại Tiệc Bí Ngô', '6 miếng gà giòn, 2 burger bò, khoai lớn và 4 Coca Cola — đại tiệc Halloween cho cả gia đình.', 329000, 429000, 23, TRUE, TRUE,
       '/images/combo-family.jpg', TRUE, id
FROM categories WHERE name = 'Combo'
AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Combo Đại Tiệc Bí Ngô');

-- Bài tin Halloween hiển thị trong mục Tin tức trên trang chủ.
INSERT INTO posts (title, slug, excerpt, content, image_url, active)
SELECT 'Halloween beobeo: Tiệc ma vui vẻ, combo ngon hết sẩy!', 'halloween-beobeo-tiec-ma-vui-ve',
       'Mùa Halloween đã đến beobeo! Khám phá combo Bí Ngô Ma Thuật, Hội Ma Bạn Bè và Đại Tiệc Bí Ngô để cùng hội bạn thưởng thức món ngon, nhận ưu đãi rùng rợn.',
       CONCAT(
           'Cùng beobeo đón Halloween với những combo giới hạn cho buổi tụ họp thật vui. ',
           'Combo Bí Ngô Ma Thuật dành cho hai người, Combo Hội Ma Bạn Bè dành cho nhóm bạn, ',
           'và Combo Đại Tiệc Bí Ngô dành cho cả gia đình. Đặt món trực tuyến, chia sẻ món ngon ',
           'và tận hưởng mùa lễ hội Halloween cùng beobeo!'
       ),
       '/images/combo-family.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = 'halloween-beobeo-tiec-ma-vui-ve');

INSERT INTO posts (title, slug, excerpt, content, image_url, active)
SELECT 'Sắp diễn ra: Ngày hội săn ưu đãi 11/11 tại beobeo', 'beobeo-uu-dai-11-11-sap-dien-ra',
       'Đánh dấu lịch 11/11! beobeo chuẩn bị chương trình ưu đãi đặc biệt với nhiều món ngon và combo hấp dẫn. Theo dõi website để cập nhật chi tiết ưu đãi khi chương trình bắt đầu.',
       CONCAT(
           'Ngày hội mua sắm 11/11 sắp đến với chương trình ưu đãi từ beobeo. Đây là dịp để bạn ',
           'thưởng thức món yêu thích và khám phá các combo hấp dẫn với mức giá đặc biệt. ',
           'Chương trình dự kiến diễn ra ngày 11/11. Thông tin về mức giảm giá và điều kiện áp dụng ',
           'sẽ được cập nhật tại đây khi chương trình chính thức bắt đầu — hãy theo dõi beobeo ',
           'để không bỏ lỡ!'
       ),
       '/images/combo-two.jpg', TRUE
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = 'beobeo-uu-dai-11-11-sap-dien-ra');

