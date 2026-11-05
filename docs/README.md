# beobeo — hướng dẫn dự án

Ứng dụng bán hàng bằng Java 17, Spring Boot, Thymeleaf và MySQL. Cấu trúc thư mục theo nhóm như dự án `D:\THLTW`:

```text
JAVA-GR26/
├── backend/                         Ứng dụng Java
│   ├── src/main/java/               Mã nguồn Spring Boot
│   ├── src/main/resources/          Cấu hình ứng dụng
│   ├── src/test/java/               Mã kiểm thử
│   ├── database/                    Schema, migrations, dữ liệu mẫu
│   ├── pom.xml                      Cấu hình Maven
│   └── target/                      File build (tự sinh)
├── docs/                            Hướng dẫn và ghi chú dự án
├── frontend/                        Giao diện website
│   ├── src/templates/               Trang Thymeleaf
│   └── public/                      Tài nguyên tĩnh
│       ├── css/                     Styles theo trang
│       ├── js/                      Script cửa hàng và admin
│       └── images/                  Ảnh minh họa
├── .gitignore
└── README.md
```

## Cài đặt và chạy

Cần Java 17+, Maven và MySQL. Tạo database `fastfood_db`, sau đó chạy `backend/database/schema.sql`. Có thể nạp dữ liệu mẫu từ `backend/database/seeds/data.sql` hoặc `backend/database/seeds/seed-showcase.sql`.

Cập nhật username/password MySQL trong `backend/src/main/resources/application.properties`.

Từ thư mục gốc dự án chạy:

```bash
mvn -f backend/pom.xml spring-boot:run
```

Hoặc vào `backend/` rồi chạy `mvn spring-boot:run`. Trang web: http://localhost:8080. Build tạo ở `backend/target/`.

Với database cũ, chạy lần lượt `backend/database/migrations/upgrade-v2.sql` đến migration mới nhất `upgrade-v10.sql`. Không chạy các migration này trên database mới vừa tạo từ `schema.sql`.

## Cách frontend được phục vụ

Maven đóng gói `frontend/src/templates` thành template Thymeleaf và `frontend/public` thành tài nguyên tĩnh của Spring Boot. URL trên trình duyệt tiếp tục là `/css/...`, `/js/...`, `/images/...`; các template tạo URL bằng `@{...}`. API `/api/...` giữ nguyên.

## Mô hình database

Ngoài tài khoản, danh mục, sản phẩm, bài viết, đơn hàng và chi tiết đơn, schema có thêm địa chỉ giao hàng, mã giảm giá, giao dịch thanh toán, tồn kho, lịch sử nhập/xuất tồn, đánh giá sản phẩm và lịch sử trạng thái đơn. Các bảng mới có entity/repository JPA tương ứng; tạo database mới từ `schema.sql`, hoặc nâng cấp database hiện có bằng `migrations/upgrade-v7.sql`.

## Tính năng

- Trang chủ hiển thị sản phẩm từ API; tìm kiếm, lọc danh mục, món mới, món ưu đãi và combo.
- Thành viên đăng ký/đăng nhập/đăng xuất, thêm món vào giỏ, lưu sản phẩm yêu thích và đặt hàng.
- Ví thành viên hỗ trợ nạp số dư qua VNPay Sandbox; số dư chỉ được cộng sau khi callback hợp lệ xác nhận đúng giao dịch và số tiền.
- Admin quản lý sản phẩm, danh mục, bài viết, đơn hàng, người dùng.
- Thanh toán online hỗ trợ VNPay, MoMo và ZaloPay sandbox. Đặt khóa merchant qua biến môi trường `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`; `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`; `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2`. Có thể đổi endpoint mặc định cho VNPay bằng `VNPAY_PAY_URL`; URL callback/return đặt qua `VNPAY_RETURN_URL`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL`, `ZALOPAY_REDIRECT_URL`, `ZALOPAY_CALLBACK_URL`. Khi chạy local, callback/IPN cần URL HTTPS công khai (ví dụ tunnel phát triển) thì cổng thanh toán mới gọi được.

### Cấu hình sandbox thanh toán

Nhận thông tin merchant sandbox từ từng nhà cung cấp, sau đó đặt biến môi trường trong cùng cửa sổ PowerShell trước khi chạy ứng dụng. Không chia sẻ hoặc commit các khóa bí mật:

```powershell
$env:VNPAY_TMN_CODE = "mã merchant được cấp"
$env:VNPAY_HASH_SECRET = "secret được cấp"
$env:VNPAY_RETURN_URL = "https://ten-mien-cong-khai/payment/vnpay/return"
$env:MOMO_PARTNER_CODE = "partner code được cấp"
$env:MOMO_ACCESS_KEY = "access key được cấp"
$env:MOMO_SECRET_KEY = "secret key được cấp"
$env:MOMO_REDIRECT_URL = "https://ten-mien-cong-khai/payment/momo/return"
$env:MOMO_IPN_URL = "https://ten-mien-cong-khai/payment/momo/ipn"
$env:ZALOPAY_APP_ID = "app id được cấp"
$env:ZALOPAY_KEY1 = "key1 được cấp"
$env:ZALOPAY_KEY2 = "key2 được cấp"
$env:ZALOPAY_REDIRECT_URL = "https://ten-mien-cong-khai/payment/zalopay/return"
$env:ZALOPAY_CALLBACK_URL = "https://ten-mien-cong-khai/payment/zalopay/callback"
mvn -f backend/pom.xml spring-boot:run
```

ZaloPay và MoMo cần URL HTTPS công khai để gửi callback/IPN đến máy phát triển. Các liên kết mặc định localhost chỉ dùng để phát triển giao diện; không thể nhận thông báo máy chủ từ nhà cung cấp.

Tạo tài khoản quản trị bằng `FASTY_ADMIN_USERNAME` và `FASTY_ADMIN_PASSWORD` (tối thiểu 8 ký tự), hoặc cấp quyền `ADMIN` cho tài khoản đã đăng ký. Khi đưa website lên môi trường công khai, cấu hình HTTPS và credentials VNPay hợp lệ.

Khi nâng cấp database hiện có để dùng ví và yêu thích, chạy `backend/database/migrations/upgrade-v8.sql` sau migration v7. Database mới tạo từ `schema.sql` đã có các bảng/cột này. Số dư ví ở môi trường Sandbox chỉ là dữ liệu thử nghiệm, không phải tiền thật.

Database cũ cần có cột tùy chỉnh món cho chi tiết đơn: chạy `backend/database/migrations/upgrade-v9.sql`. Để thêm sáu đồ uống gợi ý đặt kèm mà không ảnh hưởng các dữ liệu mẫu khác, chạy `backend/database/seeds/seed-drinks.sql` với `mysql --default-character-set=utf8mb4`. Database tạo mới từ `schema.sql` không cần migration v9.

Nếu database cũ khai báo `orders.payment_method` bằng `ENUM`, chạy `backend/database/migrations/upgrade-v10.sql` để hỗ trợ phương thức thanh toán WALLET. Database mới từ `schema.sql` đã lưu phương thức thanh toán bằng `VARCHAR(30)`.

Ví dụ tạo admin thử nghiệm trong PowerShell (chỉ dùng local, hãy đổi mật khẩu khi demo trước lớp):

```powershell
$env:FASTY_ADMIN_USERNAME = "admin"
$env:FASTY_ADMIN_PASSWORD = "BeobeoDemo2026!"
mvn -f backend/pom.xml spring-boot:run
```

Sau khi đăng nhập admin, khách hàng có thể tự tạo tài khoản tại `/register`; mật khẩu được mã hóa BCrypt. Các cổng thanh toán online chỉ hoạt động khi có merchant sandbox hợp lệ. Nếu chưa có khóa, dùng tiền mặt khi nhận hàng để trình diễn luồng đặt hàng; website sẽ báo rõ khi chọn cổng online chưa cấu hình.

Đối chiếu từng tiêu chí chấm điểm và các giới hạn còn phụ thuộc cấu hình ngoài repo tại [ASSESSMENT-IMPLEMENTATION.md](ASSESSMENT-IMPLEMENTATION.md).
