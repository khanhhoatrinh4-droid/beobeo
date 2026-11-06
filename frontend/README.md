# Frontend beobeo

Giao diện dùng Thymeleaf và JavaScript ES modules, không cần bước build JavaScript.
Spring Boot đóng gói `public/` thành tài nguyên tĩnh và `src/templates/` thành template.

## Cấu trúc

```text
src/templates/       Trang HTML Thymeleaf
public/css/          Stylesheet
public/images/       Ảnh và biểu tượng
public/js/
  pages/            Điểm khởi tạo từng trang: store, account, admin
  features/
    store/          Thực đơn, giỏ hàng, chi tiết món, yêu thích, thanh toán
    account/        Hồ sơ, lịch sử đơn, ví, danh sách yêu thích
    admin/          Bảng dữ liệu, biểu mẫu, tải ảnh
  services/         Endpoint API và lưu giỏ hàng trên thiết bị
  shared/           Định dạng tiền, escape HTML, thông báo
  state/            Trạng thái dùng chung trong từng trang
tests/              Kiểm thử tích hợp DOM và HTTP với API giả lập
```

`pages` nối các chức năng; `features` xử lý tương tác và hiển thị; `services` gọi API.
Chỉ `services/http.js` gọi `fetch`, xử lý JSON, lỗi HTTP và CSRF. Upload dùng FormData
để trình duyệt tự đặt multipart boundary. Các module dùng import/export, không phụ thuộc
biến toàn cục hoặc thứ tự nhiều thẻ script.

Khi thêm endpoint, khai báo trong service phù hợp rồi gọi từ feature.
Khi thêm chức năng giao diện, tạo module trong `features` và khởi tạo từ `pages`.
Các thẻ script trong template phải có `type="module"`.

## Chạy và kiểm tra

Chạy ứng dụng từ thư mục gốc: `mvn -f backend/pom.xml spring-boot:run`.
Nếu máy chủ đang chạy từ `target/classes`, chạy `mvn -f backend/pom.xml resources:resources`
sau khi sửa tài nguyên frontend, rồi tải lại trang.

Công cụ phát triển (không cần để phục vụ website):

```powershell
cd frontend
npm ci
npm run lint
npm test
```

Kiểm thử bao gồm HTTP/CSRF, FormData, thực đơn, tìm kiếm, tùy chỉnh món, giỏ hàng,
yêu thích, thanh toán thành công/thất bại, phân trang quản trị và trang tài khoản.
