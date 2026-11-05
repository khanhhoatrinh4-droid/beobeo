# FastFood Management

Hệ thống web bán hàng và quản lý nhà hàng thức ăn nhanh.

## Công nghệ

- Java 17
- Spring Boot
- Maven
- Spring Web
- Spring Data JPA / Hibernate
- Thymeleaf
- MySQL

## Chạy project

### 1. Tạo database

Mở MySQL và chạy:

```sql
CREATE DATABASE fastfood_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Hoặc chạy file `database/schema.sql`, sau đó `database/data.sql`.

Nếu database đã được tạo từ phiên bản cũ, chạy thêm `database/upgrade-v2.sql` trong phpMyAdmin/XAMPP để có giá gốc, giảm giá, món nổi bật và combo.

Chạy lần lượt `database/upgrade-v3.sql` và `database/upgrade-v4.sql` để bổ sung thông tin món, người dùng và thanh toán. Database mới tạo từ `schema.sql` đã có sẵn các cột này.

### 2. Cấu hình MySQL

Mở:

`src/main/resources/application.properties`

Sửa:

```properties
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

### 3. Chạy

```bash
mvn spring-boot:run
```

Hoặc chạy `FastFoodApplication.java` trong IntelliJ IDEA.

Website:

http://localhost:8080

## Chức năng trang chủ

- Thực đơn lấy dữ liệu động từ MySQL qua `/api/products`.
- Các nhóm `/api/products/sale`, `/featured`, `/combos` hiển thị từ các cột tương ứng của bảng `products`.
- Xem chi tiết món, thêm/xóa món khỏi giỏ hàng; giỏ hàng được lưu tạm trên trình duyệt.
- Chi tiết sản phẩm gồm nguyên liệu, calories và thời gian chế biến; bản đồ cửa hàng được nhúng từ Google Maps.
- Checkout tạo đơn hàng và chi tiết món trong MySQL qua `/api/orders`.
- Trang quản trị tại `/admin` hỗ trợ thêm/sửa/xóa sản phẩm, đổi trạng thái đơn và bật/tắt tài khoản người dùng.
- Thành viên đăng ký tại `/register`, đăng nhập tại `/login`; mật khẩu được lưu bằng BCrypt. Tài khoản đăng ký mới luôn có vai trò CUSTOMER.
- Để tạo/cấp tài khoản admin ban đầu, đặt `FASTY_ADMIN_USERNAME` và `FASTY_ADMIN_PASSWORD` rồi khởi động lại ứng dụng. Nếu tài khoản đã tồn tại, ứng dụng sẽ cấp role ADMIN cho username đã cấu hình. Hoặc sau khi đăng ký, chạy SQL `UPDATE users SET role='ADMIN' WHERE username='ten_dang_nhap';` và đăng xuất/đăng nhập lại. Chỉ tài khoản ADMIN vào được `/admin` và API quản trị.
- Checkout yêu cầu đăng nhập. Chọn VNPay sẽ tạo đơn chờ thanh toán và chuyển sang cổng VNPay để quét QR/thanh toán; đơn chỉ xác nhận khi callback có chữ ký, số tiền và mã giao dịch hợp lệ.

Để bật VNPay sandbox, đặt biến môi trường `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` và `VNPAY_RETURN_URL` (URL callback phải truy cập được từ internet khi thử thanh toán). Mặc định endpoint dùng sandbox, credentials merchant không được cung cấp kèm dự án. Cấu hình callback `/payment/vnpay/return` trên VNPay merchant. Tài liệu: [VNPay Pay API](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html).

Lưu ý: các thao tác quản trị đã được bảo vệ bằng Spring Security. Trước khi chạy trên internet, cấu hình HTTPS, URL callback công khai và merchant credentials VNPay của bạn.

## Cấu trúc

- `controller`: nhận HTTP request
- `service`: xử lý nghiệp vụ
- `repository`: truy cập database
- `entity`: các bảng database
- `dto`: dữ liệu request/response
- `config`: cấu hình ứng dụng
- `exception`: xử lý lỗi
- `enums`: các trạng thái dùng chung

## Quy tắc Git đề xuất

Không push trực tiếp vào `main`.

```text
main
  └── develop
       ├── feature/product
       ├── feature/order
       ├── feature/user
       └── feature/admin
```

Tên commit:

```text
feat: add product CRUD
fix: fix order total calculation
refactor: improve product service
docs: update README
```
