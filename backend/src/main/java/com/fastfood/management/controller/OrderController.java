package com.fastfood.management.controller;

import com.fastfood.management.dto.CheckoutRequest;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.OrderDetail;
import com.fastfood.management.entity.OrderStatusHistory;
import com.fastfood.management.entity.PaymentTransaction;
import com.fastfood.management.entity.Product;
import com.fastfood.management.enums.OrderStatus;
import com.fastfood.management.enums.PaymentMethod;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.repository.OrderStatusHistoryRepository;
import com.fastfood.management.repository.PaymentTransactionRepository;
import com.fastfood.management.repository.UserRepository;
import com.fastfood.management.service.ProductService;
import com.fastfood.management.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactions;
    private final OrderStatusHistoryRepository statusHistory;
    private final com.fastfood.management.payment.VnPayService vnPayService;
    private final com.fastfood.management.payment.MomoService momoService;
    private final com.fastfood.management.payment.ZaloPayService zaloPayService;
    private final WalletService walletService;

    public OrderController(OrderRepository orderRepository, ProductService productService, UserRepository userRepository,
                           PaymentTransactionRepository paymentTransactions, OrderStatusHistoryRepository statusHistory,
                           com.fastfood.management.payment.VnPayService vnPayService,
                           com.fastfood.management.payment.MomoService momoService,
                           com.fastfood.management.payment.ZaloPayService zaloPayService,
                           WalletService walletService) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.userRepository = userRepository;
        this.paymentTransactions = paymentTransactions;
        this.statusHistory = statusHistory;
        this.vnPayService = vnPayService;
        this.momoService = momoService;
        this.zaloPayService = zaloPayService;
        this.walletService = walletService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> findAll(@AuthenticationPrincipal UserDetails principal,
                                     @RequestParam(defaultValue = "0") int page) {
        if (page < 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số trang không hợp lệ."));
        }
        Page<Order> orders = orderRepository.findByCustomer_Username(
                principal.getUsername(),
                PageRequest.of(page, 4, Sort.by(Sort.Direction.DESC, "orderDate")));
        return ResponseEntity.ok(new OrderPage(
                orders.getContent(), orders.getNumber(), orders.getSize(),
                orders.getTotalElements(), orders.getTotalPages()));
    }

    public record OrderPage(List<Order> content, int page, int size, long totalElements, int totalPages) { }

    @GetMapping("/admin/all")
    public List<Order> findAllForAdmin() { return orderRepository.findAll(); }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody CheckoutRequest request, @AuthenticationPrincipal UserDetails principal,
                                    jakarta.servlet.http.HttpServletRequest servletRequest) {
        if (request == null || request.customerName() == null || request.customerName().isBlank()
                || request.customerName().trim().length() > 150
                || request.address() == null || request.address().isBlank() || request.address().trim().length() > 500) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập họ tên (tối đa 150 ký tự) và địa chỉ nhận hàng (tối đa 500 ký tự)."));
        }
        if (request.phone() == null || !request.phone().matches("[0-9+() .-]{9,20}")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại cần từ 9 đến 20 ký tự; vui lòng kiểm tra lại."));
        }
        if (request.items() == null || request.items().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giỏ hàng đang trống. Vui lòng chọn ít nhất một món."));
        }
        if (request.items().size() > 50) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mỗi đơn hàng tối đa 50 dòng món."));
        }
        Order order = new Order();
        var customer = userRepository.findByUsername(principal.getUsername()).orElseThrow();
        order.setCustomer(customer);
        order.setCustomerName(request.customerName().trim());
        order.setCustomerPhone(request.phone().trim());
        order.setShippingAddress(request.address().trim());
        PaymentMethod method = request.paymentMethod() == null ? PaymentMethod.CASH : request.paymentMethod();
        if (method != PaymentMethod.CASH && method != PaymentMethod.VNPAY
                && method != PaymentMethod.MOMO && method != PaymentMethod.ZALOPAY
                && method != PaymentMethod.WALLET) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phương thức thanh toán này hiện chưa được hỗ trợ."));
        }
        order.setPaymentMethod(method);
        order.setOrderDate(LocalDateTime.now());
        BigDecimal total = BigDecimal.ZERO;
        for (CheckoutRequest.Item item : request.items()) {
            if (item == null || item.productId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Sản phẩm trong giỏ hàng không hợp lệ."));
            }
            if (item.quantity() == null || item.quantity() < 1 || item.quantity() > 99) {
                return ResponseEntity.badRequest().body(Map.of("message", "Số lượng món không hợp lệ."));
            }
            Product product = productService.findById(item.productId()).orElse(null);
            if (product == null || !product.isActive()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Một sản phẩm không còn kinh doanh."));
            }
            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setProduct(product);
            detail.setQuantity(item.quantity());
            detail.setUnitPrice(product.getPrice());
            detail.setPrice(product.getPrice());
            detail.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(item.quantity())));
            if (item.customizations() != null && item.customizations().length() > 500) {
                return ResponseEntity.badRequest().body(Map.of("message", "Tuỳ chỉnh món ăn tối đa 500 ký tự."));
            }
            detail.setCustomizations(item.customizations() == null || item.customizations().isBlank()
                    ? null : item.customizations().trim());
            order.getItems().add(detail);
            total = total.add(detail.getSubtotal());
        }
        order.setTotalAmount(total);
        order.setCustomerPhone(request.phone().trim());
        com.fastfood.management.entity.User walletCustomer = null;
        if (method == PaymentMethod.WALLET) {
            walletCustomer = userRepository.findByIdForUpdate(customer.getId()).orElseThrow();
            if (walletCustomer.getWalletBalance().compareTo(total) < 0) {
                BigDecimal shortfall = total.subtract(walletCustomer.getWalletBalance());
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Số dư ví không đủ. Bạn cần nạp thêm "
                                + shortfall.toPlainString() + " đ hoặc chọn phương thức thanh toán khác."));
            }
            order.setPaid(true);
        }
        if (isOnlinePayment(request.paymentMethod())) {
            if (request.paymentMethod() == PaymentMethod.VNPAY && !vnPayService.isConfigured()
                    || request.paymentMethod() == PaymentMethod.MOMO && !momoService.isConfigured()
                    || request.paymentMethod() == PaymentMethod.ZALOPAY && !zaloPayService.isConfigured()) {
                return ResponseEntity.status(503).body(Map.of("message", "Cổng thanh toán chưa được cấu hình khóa merchant sandbox. Hãy liên hệ quản trị viên."));
            }
            order.setStatus(OrderStatus.AWAITING_PAYMENT);
            order.setPaymentReference("beobeo" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        }
        Order saved = orderRepository.save(order);
        if (walletCustomer != null) {
            walletService.chargeForOrder(walletCustomer, total, saved.getId());
            saved.setPaymentReference("WALLET-ORDER-" + saved.getId());
            orderRepository.save(saved);
        }
        recordStatusChange(saved, null, saved.getStatus(), customer,
                walletCustomer == null ? "Tạo đơn hàng" : "Tạo đơn hàng, thanh toán bằng ví thành viên");
        if (isOnlinePayment(saved.getPaymentMethod())) {
            PaymentTransaction payment = new PaymentTransaction();
            payment.setOrder(saved);
            payment.setProvider(saved.getPaymentMethod().name());
            payment.setTransactionReference(saved.getPaymentReference());
            payment.setAmount(saved.getTotalAmount());
            paymentTransactions.save(payment);
            String paymentUrl = switch (saved.getPaymentMethod()) {
                case VNPAY -> vnPayService.createPaymentUrl(saved, servletRequest.getRemoteAddr());
                case MOMO -> momoService.createPaymentUrl(saved);
                case ZALOPAY -> zaloPayService.createPaymentUrl(saved, customer.getUsername());
                default -> throw new IllegalStateException("Cổng thanh toán không được hỗ trợ.");
            };
            return ResponseEntity.ok(Map.of("id", saved.getId(), "status", saved.getStatus(),
                    "totalAmount", saved.getTotalAmount(), "paymentUrl", paymentUrl));
        }
        return ResponseEntity.ok(Map.of("id", saved.getId(), "status", saved.getStatus(),
                "totalAmount", saved.getTotalAmount(), "paid", saved.isPaid()));
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body,
                                          @AuthenticationPrincipal UserDetails principal) {
        try {
            OrderStatus status = OrderStatus.valueOf(body.getOrDefault("status", ""));
            return orderRepository.findById(id).map(order -> {
                if (!isAllowedAdminTransition(order, status)) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Không thể chuyển đơn sang trạng thái này."));
                }
                if (order.getStatus() != status) {
                    var actor = principal == null ? null : userRepository.findByUsername(principal.getUsername()).orElse(null);
                    String note = body.get("note");
                    if (note == null || note.isBlank()) note = "Cập nhật bởi quản trị viên";
                    if (status == OrderStatus.CANCELLED && isPaidWalletOrder(order)) {
                        walletService.refundOrder(order.getCustomer(), order.getTotalAmount(), order.getId());
                        note += " · Hoàn tiền vào ví thành viên";
                    }
                    recordStatusChange(order, order.getStatus(), status, actor, note);
                }
                order.setStatus(status);
                return ResponseEntity.ok(orderRepository.save(order));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái đơn hàng không hợp lệ."));
        }
    }

    @PatchMapping("/{id}/cancel")
    @Transactional
    public ResponseEntity<?> cancelByCustomer(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        return orderRepository.findById(id).map(order -> {
            if (!order.getCustomer().getUsername().equals(principal.getUsername())) {
                return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền hủy đơn này."));
            }
            boolean paidByWallet = isPaidWalletOrder(order);
            if (order.getStatus() != OrderStatus.PENDING || order.isPaid() && !paidByWallet) {
                return ResponseEntity.badRequest().body(Map.of("message", "Chỉ có thể hủy đơn chưa được xác nhận và chưa thanh toán."));
            }
            if (paidByWallet) {
                walletService.refundOrder(order.getCustomer(), order.getTotalAmount(), order.getId());
            }
            var actor = userRepository.findByUsername(principal.getUsername()).orElse(null);
            recordStatusChange(order, order.getStatus(), OrderStatus.CANCELLED, actor,
                    paidByWallet ? "Khách hàng hủy đơn · Đã hoàn tiền vào ví thành viên" : "Khách hàng yêu cầu hủy đơn");
            order.setStatus(OrderStatus.CANCELLED);
            return ResponseEntity.ok(orderRepository.save(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    private boolean isAllowedAdminTransition(Order order, OrderStatus next) {
        OrderStatus current = order.getStatus();
        if (current == next) return true;
        if (current == OrderStatus.CANCELLED || current == OrderStatus.COMPLETED) return false;
        if (current == OrderStatus.AWAITING_PAYMENT) return false;
        return switch (current) {
            case PENDING -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.PREPARING || next == OrderStatus.CANCELLED;
            case PREPARING -> next == OrderStatus.READY || next == OrderStatus.CANCELLED;
            case READY -> next == OrderStatus.DELIVERING || next == OrderStatus.CANCELLED;
            case DELIVERING -> next == OrderStatus.COMPLETED;
            default -> false;
        };
    }

    private boolean isPaidWalletOrder(Order order) {
        return order.isPaid() && order.getPaymentMethod() == PaymentMethod.WALLET;
    }

    private void recordStatusChange(Order order, OrderStatus previous, OrderStatus next,
                                    com.fastfood.management.entity.User actor, String note) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setChangedBy(actor);
        history.setPreviousStatus(previous == null ? null : previous.name());
        history.setNewStatus(next.name());
        history.setNote(note);
        statusHistory.save(history);
    }

    private boolean isOnlinePayment(PaymentMethod method) {
        return method == PaymentMethod.VNPAY || method == PaymentMethod.MOMO || method == PaymentMethod.ZALOPAY;
    }
}
