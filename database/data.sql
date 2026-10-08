USE fastfood_db;

INSERT INTO categories (name, description) VALUES
('Burger', 'Các loại burger'),
('Chicken', 'Gà rán và gà chiên'),
('Drink', 'Nước uống'),
('Combo', 'Các phần ăn combo');

INSERT INTO products (name, description, price, image_url, category_id) VALUES
('Classic Burger', 'Burger bò truyền thống', 45000, '/images/classic-burger.jpg', 1),
('Crispy Chicken', 'Gà rán giòn', 35000, '/images/crispy-chicken.jpg', 2),
('Coca Cola', 'Nước ngọt Coca Cola', 15000, '/images/coca.jpg', 3),
('Burger Combo', 'Burger + khoai + nước', 75000, '/images/combo.jpg', 4);
