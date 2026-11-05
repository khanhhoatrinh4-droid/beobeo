USE fastfood_db;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(80) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT FALSE;

-- Người dùng hiện tại được mặc định là khách hàng, không tự cấp quyền admin.
UPDATE users SET role = 'CUSTOMER' WHERE role IS NULL OR role = '';
