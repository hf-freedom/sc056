package com.auction.service;

import com.auction.entity.*;
import com.auction.entity.enums.AuctionStatus;
import com.auction.entity.enums.OrderStatus;
import com.auction.repository.InMemoryStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AuctionService {

    @Autowired
    private InMemoryStore inMemoryStore;

    @Autowired
    private BidService bidService;

    @Autowired
    private DepositService depositService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private ReportService reportService;

    public List<AuctionItem> getAllAuctionItems() {
        return inMemoryStore.getAuctionItems().values().stream()
                .sorted(Comparator.comparing(AuctionItem::getStartTime))
                .collect(Collectors.toList());
    }

    public Optional<AuctionItem> getAuctionItemById(Long id) {
        return Optional.ofNullable(inMemoryStore.getAuctionItems().get(id));
    }

    public List<User> getAllUsers() {
        return inMemoryStore.getUsers().values().stream()
                .collect(Collectors.toList());
    }

    public Optional<User> getUserById(Long id) {
        return Optional.ofNullable(inMemoryStore.getUsers().get(id));
    }

    public AuctionItem createAuctionItem(AuctionItem item) {
        if (item.getName() == null || item.getName().trim().isEmpty()) {
            throw new RuntimeException("拍品名称不能为空");
        }
        if (item.getStartingPrice() == null || item.getStartingPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("起拍价必须大于0");
        }
        if (item.getIncrementAmount() == null || item.getIncrementAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("加价幅度必须大于0");
        }
        if (item.getDepositAmount() == null || item.getDepositAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("保证金不能为负数");
        }
        if (item.getStartTime() == null) {
            throw new RuntimeException("拍卖开始时间不能为空");
        }
        if (item.getEndTime() == null) {
            throw new RuntimeException("拍卖结束时间不能为空");
        }
        if (item.getEndTime().isBefore(item.getStartTime())) {
            throw new RuntimeException("结束时间不能早于开始时间");
        }

        LocalDateTime now = LocalDateTime.now();
        AuctionStatus status;
        if (now.isBefore(item.getStartTime())) {
            status = AuctionStatus.UPCOMING;
        } else if (now.isAfter(item.getEndTime())) {
            status = AuctionStatus.ENDED;
        } else {
            status = AuctionStatus.ACTIVE;
        }

        AuctionItem newItem = new AuctionItem();
        newItem.setId(inMemoryStore.generateAuctionItemId());
        newItem.setName(item.getName());
        newItem.setDescription(item.getDescription());
        newItem.setImageUrl(item.getImageUrl());
        newItem.setStartingPrice(item.getStartingPrice());
        newItem.setCurrentPrice(item.getStartingPrice());
        newItem.setIncrementAmount(item.getIncrementAmount());
        newItem.setDepositAmount(item.getDepositAmount());
        newItem.setStartTime(item.getStartTime());
        newItem.setEndTime(item.getEndTime());
        newItem.setStatus(status);
        newItem.setCreatedAt(now);
        newItem.setUpdatedAt(now);

        inMemoryStore.getAuctionItems().put(newItem.getId(), newItem);

        return newItem;
    }

    public AuctionItem updateAuctionItem(Long id, AuctionItem updateItem) {
        AuctionItem existingItem = inMemoryStore.getAuctionItems().get(id);
        if (existingItem == null) {
            throw new RuntimeException("拍品不存在");
        }

        if (existingItem.getStatus() == AuctionStatus.ACTIVE || 
            existingItem.getStatus() == AuctionStatus.ENDED ||
            existingItem.getStatus() == AuctionStatus.SOLD) {
            throw new RuntimeException("正在进行、已结束或已成交的拍品不能编辑");
        }

        LocalDateTime now = LocalDateTime.now();

        if (updateItem.getName() != null && !updateItem.getName().trim().isEmpty()) {
            existingItem.setName(updateItem.getName());
        }
        if (updateItem.getDescription() != null) {
            existingItem.setDescription(updateItem.getDescription());
        }
        if (updateItem.getImageUrl() != null) {
            existingItem.setImageUrl(updateItem.getImageUrl());
        }
        if (updateItem.getStartingPrice() != null && updateItem.getStartingPrice().compareTo(BigDecimal.ZERO) > 0) {
            existingItem.setStartingPrice(updateItem.getStartingPrice());
            if (existingItem.getCurrentPrice().compareTo(existingItem.getStartingPrice()) <= 0) {
                existingItem.setCurrentPrice(updateItem.getStartingPrice());
            }
        }
        if (updateItem.getIncrementAmount() != null && updateItem.getIncrementAmount().compareTo(BigDecimal.ZERO) > 0) {
            existingItem.setIncrementAmount(updateItem.getIncrementAmount());
        }
        if (updateItem.getDepositAmount() != null && updateItem.getDepositAmount().compareTo(BigDecimal.ZERO) >= 0) {
            existingItem.setDepositAmount(updateItem.getDepositAmount());
        }
        if (updateItem.getStartTime() != null) {
            existingItem.setStartTime(updateItem.getStartTime());
        }
        if (updateItem.getEndTime() != null) {
            if (existingItem.getStartTime() != null && updateItem.getEndTime().isBefore(existingItem.getStartTime())) {
                throw new RuntimeException("结束时间不能早于开始时间");
            }
            existingItem.setEndTime(updateItem.getEndTime());
        }

        if (now.isBefore(existingItem.getStartTime())) {
            existingItem.setStatus(AuctionStatus.UPCOMING);
        } else if (now.isAfter(existingItem.getEndTime())) {
            existingItem.setStatus(AuctionStatus.ENDED);
        } else {
            existingItem.setStatus(AuctionStatus.ACTIVE);
        }

        existingItem.setUpdatedAt(now);

        return existingItem;
    }

    public void deleteAuctionItem(Long id) {
        AuctionItem item = inMemoryStore.getAuctionItems().get(id);
        if (item == null) {
            throw new RuntimeException("拍品不存在");
        }

        if (item.getStatus() == AuctionStatus.ACTIVE) {
            throw new RuntimeException("正在进行的拍品不能删除");
        }

        inMemoryStore.getAuctionItems().remove(id);
    }

    @Scheduled(fixedRateString = "${auction.scheduled-check-interval-seconds:10000}")
    public void processAuctionStatus() {
        LocalDateTime now = LocalDateTime.now();

        for (AuctionItem item : inMemoryStore.getAuctionItems().values()) {
            if (item.getStatus() == AuctionStatus.UPCOMING && now.isAfter(item.getStartTime())) {
                item.setStatus(AuctionStatus.ACTIVE);
                item.setUpdatedAt(now);
            }

            if (item.getStatus() == AuctionStatus.ACTIVE && now.isAfter(item.getEndTime())) {
                endAuction(item);
            }
        }

        for (Order order : orderService.findByStatus(OrderStatus.AWAITING_PAYMENT)) {
            if (now.isAfter(order.getBalancePaymentDeadline())) {
                handlePaymentTimeout(order);
            }
        }
    }

    public void endAuction(AuctionItem item) {
        if (item.getStatus() != AuctionStatus.ACTIVE) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        item.setStatus(AuctionStatus.ENDED);
        item.setUpdatedAt(now);

        Optional<Bid> highestBid = bidService.findHighestBid(item.getId());

        if (highestBid.isPresent()) {
            Long winnerId = highestBid.get().getUserId();
            item.setWinnerId(winnerId);
            item.setUpdatedAt(now);

            Order order = orderService.createOrder(item, winnerId, highestBid.get().getAmount());

            depositService.releaseDepositsForAuction(item.getId(), winnerId);

            reportService.generateReport(item, highestBid.get());
        } else {
            item.setStatus(AuctionStatus.CANCELLED);
            item.setUpdatedAt(now);

            depositService.releaseDepositsForAuction(item.getId(), null);

            reportService.generateNoBidReport(item);
        }
    }

    public void handlePaymentTimeout(Order order) {
        orderService.handleDefault(order.getId());

        AuctionItem item = inMemoryStore.getAuctionItems().get(order.getAuctionItemId());
        if (item == null) {
            return;
        }

        Optional<Bid> secondHighest = bidService.findSecondHighestBid(item.getId());

        if (secondHighest.isPresent()) {
            awardToNextBidder(item, secondHighest.get());
        } else {
            item.setStatus(AuctionStatus.REAUCTION);
            item.setUpdatedAt(LocalDateTime.now());
        }
    }

    public void awardToNextBidder(AuctionItem item, Bid nextBid) {
        LocalDateTime now = LocalDateTime.now();

        Long newWinnerId = nextBid.getUserId();
        item.setWinnerId(newWinnerId);
        item.setCurrentPrice(nextBid.getAmount());
        item.setUpdatedAt(now);

        Order newOrder = orderService.createOrder(item, newWinnerId, nextBid.getAmount());

        depositService.releaseDepositsForAuction(item.getId(), newWinnerId);
    }
}
