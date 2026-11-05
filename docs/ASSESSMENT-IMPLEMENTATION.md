# Đối chiếu phiếu chấm đồ án

Tài liệu này đối chiếu rubric cuối môn với mã nguồn hiện tại. Các mục yêu cầu dịch vụ hoặc thông tin merchant bên ngoài được ghi rõ để nhóm chuẩn bị trước buổi chấm.

| Tiêu chí | Đã có trong dự án | Cách trình diễn / điểm cần chuẩn bị |
| --- | --- | --- |
| Database | MySQL, khóa chính/ngoại, đơn và chi tiết đơn, người dùng, sản phẩm, danh mục, coupon, tồn kho, đánh giá, lịch sử trạng thái và giao dịch thanh toán; có schema và seed showcase. | Tạo mới bằng `backend/database/schema.sql`; nạp dữ liệu theo `docs/README.md`. |
| CRUD | Admin tạo/sửa/xóa sản phẩm, danh mục, bài viết; tìm kiếm/lọc danh sách; xóa sản phẩm đã có trong đơn sẽ chuyển sang ẩn để giữ lịch sử. | Đăng nhập admin, thao tác từng nhóm dữ liệu và thử xóa danh mục đang được sản phẩm sử dụng. |
| Security | Đăng ký, đăng nhập, đăng xuất; BCrypt; phân quyền CUSTOMER/ADMIN; CSRF cho form/API ghi dữ liệu; truy vấn qua Spring Data JPA. | Tạo admin qua biến môi trường, tạo customer tại `/register`; thử mở `/admin` bằng customer và thử request ghi thiếu quyền. |
| Thương mại | Giỏ hàng, kiểm tra lại giá từ database, đặt đơn, lưu chi tiết và lịch sử; hỗ trợ tiền mặt và ba tích hợp VNPay/MoMo/ZaloPay. | Tiền mặt chạy được local. Thanh toán online cần merchant sandbox; callback MoMo/ZaloPay cần URL HTTPS công khai. Không có khóa merchant thì API trả thông báo cấu hình thay vì ghi nhận đơn thanh toán dở dang. |
| Giao diện | Trang cửa hàng, đăng nhập/đăng ký, trang tài khoản và dashboard admin; tìm kiếm/lọc; phản hồi thao tác; layout responsive và trạng thái danh sách trống/lỗi. | Nên trình diễn trên desktop và màn hình hẹp; kiểm tra dữ liệu dài và trạng thái không tìm thấy. |
| Tính năng bổ sung | Combo/ưu đãi, bài viết chiến dịch, mã coupon và hạ tầng tồn kho/đánh giá/lịch sử đơn. | Các module coupon, tồn kho và đánh giá hiện có entity/schema nhưng chưa có luồng CRUD/API đầy đủ trên giao diện; không nên trình bày chúng là chức năng hoàn thiện. |
| Nâng cao kỹ thuật | Phân lớp controller/service/repository, giao dịch DB, snapshot giá đơn, kiểm tra chữ ký callback thanh toán, ràng buộc chuyển trạng thái, soft-delete sản phẩm có lịch sử. | Không có mô tả riêng về điểm số cho mục này trong phiếu; hãy giải thích bằng luồng thanh toán, bảo toàn dữ liệu đơn và phân quyền. |

## Những phần vừa hoàn thiện

- Checkout không ghi đè tên người nhận do khách nhập bằng tên hồ sơ tài khoản.
- Chỉ chấp nhận các phương thức đang được hỗ trợ thực sự: tiền mặt, VNPay, MoMo và ZaloPay; bỏ lựa chọn chuyển khoản/QR chưa có quy trình xử lý.
- Chỉ tạo bản ghi giao dịch thanh toán khi dùng cổng online.
- Kiểm tra độ dài và định dạng dữ liệu cơ bản khi đặt hàng; giới hạn số dòng món mỗi đơn.
- Kiểm tra giới hạn đầu vào bài viết và mô tả danh mục trước khi lưu.

## Giới hạn còn lại

- Tích hợp online không thể xác nhận end-to-end nếu chưa được cấp khóa sandbox và URL callback HTTPS công khai.
- Coupon, quản lý nhập/xuất tồn và đánh giá sản phẩm cần API/controller và giao diện nghiệp vụ trước khi có thể tính là tính năng sử dụng được.
- Dashboard hiện tải danh sách về trình duyệt để tìm kiếm/lọc; phân trang phía máy chủ chưa được triển khai cho dữ liệu lớn.
