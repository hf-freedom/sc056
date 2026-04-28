package com.auction.service;

import com.auction.entity.AuctionItem;
import com.auction.entity.Deposit;
import com.auction.entity.Order;
import com.auction.entity.User;
import com.auction.entity.enums.AuctionStatus;
import com.auction.entity.enums.DepositStatus;
import com.auction.entity.enums.OrderStatus;
import com.auction.repository.InMemoryStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private InMemoryStore inMemoryStore;

    @Autowired
    private DepositService depositService;

    @Value("${auction.balance-payment-hours:24}")
    private int balancePaymentHours;

    private final Random random = new Random();

    public Optional<Order> findById(Long id) {
        return Optional.ofNullable(inMemoryStore.getOrders().get(id));
    }

    public List<Order> findByUserId(Long userId) {
        return inMemoryStore.getOrders().values().stream()
                .filter(o -> o.getUserId().equals(userId))
                .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public Optional<Order> findByAuctionItemId(Long auctionItemId) {
        return inMemoryStore.getOrders().values().stream()
                .filter(o -> o.getAuctionItemId().equals(auctionItemId))
                .findFirst();
    }

    public List<Order> findByStatus(OrderStatus status) {
        return inMemoryStore.getOrders().values().stream()
                .filter(o -> o.getStatus().equals(status))
                .collect(Collectors.toList());
    }

    public Order createOrder(AuctionItem item, Long winnerId, BigDecimal finalPrice) {
        Order existingOrder = findByAuctionItemId(item.getId()).orElse(null);
        if (existingOrder != null) {
            return existingOrder;
        }

        Order order = new Order();
        order.setId(inMemoryStore.generateOrderId());
        order.setOrderNo(generateOrderNo());
        order.setAuctionItemId(item.getId());
        order.setUserId(winnerId);
        order.setTotalAmount(finalPrice);
        order.setDepositAmount(item.getDepositAmount());
        order.setBalanceAmount(finalPrice.subtract(item.getDepositAmount()));
        order.setPaidAmount(BigDecimal.ZERO);
        order.setBalancePaymentDeadline(LocalDateTime.now().plusHours(balancePaymentHours));
        order.setStatus(OrderStatus.AWAITING_PAYMENT);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        inMemoryStore.getOrders().put(order.getId(), order);

        return order;
    }

    public Order payBalance(Long orderId) {
        Order order = inMemoryStore.getOrders().get(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        if (order.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            throw new RuntimeException("订单状态不允许支付");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(order.getBalancePaymentDeadline())) {
            throw new RuntimeException("支付期限已过");
        }

        User user = inMemoryStore.getUsers().get(order.getUserId());
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        BigDecimal balanceAmount = order.getBalanceAmount();
        if (user.getBalance().compareTo(balanceAmount) < 0) {
            throw new RuntimeException("余额不足");
        }

        user.setBalance(user.getBalance().subtract(balanceAmount));
        user.setUpdatedAt(now);

        Optional<Deposit> deposit = depositService.findByUserIdAndAuctionItemId(
                order.getUserId(), order.getAuctionItemId());
        deposit.ifPresent(depositService::convertDepositToPayment);

        order.setPaidAmount(order.getTotalAmount());
        order.setStatus(OrderStatus.PAID);
        order.setUpdatedAt(now);

        AuctionItem item = inMemoryStore.getAuctionItems().get(order.getAuctionItemId());
        if (item != null) {
            item.setStatus(AuctionStatus.SOLD);
            item.setUpdatedAt(now);
        }

        return order;
    }

    public void handleDefault(Long orderId) {
        Order order = inMemoryStore.getOrders().get(orderId);
        if (order == null) {
            return;
        }

        if (order.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(order.getBalancePaymentDeadline())) {
            return;
        }

        order.setStatus(OrderStatus.DEFAULTED);
        order.setUpdatedAt(now);

        Optional<Deposit> deposit = depositService.findByUserIdAndAuctionItemId(
                order.getUserId(), order.getAuctionItemId());
        deposit.ifPresent(depositService::deductDeposit);

        AuctionItem item = inMemoryStore.getAuctionItems().get(order.getAuctionItemId());
        if (item != null) {
            item.setWinnerId(null);
            item.setUpdatedAt(now);
        }
    }

    private String generateOrderNo() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int randomPart = 1000 + random.nextInt(9000);
        return "AU" + datePart + randomPart;
    }
}
