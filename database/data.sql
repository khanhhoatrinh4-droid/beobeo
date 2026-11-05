USE fastfood_db;

INSERT INTO categories (name, description) VALUES
('Burger', 'Các loại burger'),
('Chicken', 'Gà rán và gà chiên'),
('Drink', 'Nước uống'),
('Combo', 'Các phần ăn combo');

INSERT INTO products (name, description, price, original_price, discount_percent, featured, combo_product, image_url, category_id) VALUES
('Burger Bò Phô Mai', 'Bò nướng thơm mềm, phô mai cheddar và rau xanh tươi giòn.', 59000, 69000, 14, TRUE, FALSE, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80', 1),
('Gà Giòn Cay', '2 miếng gà chiên giòn rụm với vị cay vừa phải, ăn là ghiền.', 49000, 59000, 17, TRUE, FALSE, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=900&q=80', 2),
('Khoai Tây Lắc Phô Mai', 'Khoai tây vàng giòn phủ bột phô mai thơm béo.', 29000, NULL, 0, TRUE, FALSE, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80', 2),
('Combo No Nê', 'Burger bò, gà giòn, khoai tây và 2 nước ngọt cho 2 người.', 129000, 159000, 19, TRUE, TRUE, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 4),
('Combo Gia Đình', '4 miếng gà, 2 burger, khoai lớn và 4 nước ngọt.', 219000, 269000, 19, TRUE, TRUE, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=900&q=80', 4),
('Coca Cola Mát Lạnh', 'Nước ngọt có ga dùng kèm đá, giải khát tức thì.', 15000, NULL, 0, FALSE, FALSE, 'https://images.unsplash.com/photo-1629203865338-5a9db75c1b27?auto=format&fit=crop&w=900&q=80', 3);
