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
