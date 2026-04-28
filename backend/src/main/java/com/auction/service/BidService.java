package com.auction.service;

import com.auction.entity.AuctionItem;
import com.auction.entity.Bid;
import com.auction.entity.enums.AuctionStatus;
import com.auction.repository.InMemoryStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BidService {

    @Autowired
    private InMemoryStore inMemoryStore;

    @Autowired
    private DepositService depositService;

    public List<Bid> findByAuctionItemId(Long auctionItemId) {
        return inMemoryStore.getBids().values().stream()
                .filter(b -> b.getAuctionItemId().equals(auctionItemId))
                .sorted(Comparator.comparing(Bid::getBidTime).reversed())
                .collect(Collectors.toList());
    }

    public List<Bid> findByUserId(Long userId) {
        return inMemoryStore.getBids().values().stream()
                .filter(b -> b.getUserId().equals(userId))
                .sorted(Comparator.comparing(Bid::getBidTime).reversed())
                .collect(Collectors.toList());
    }

    public Optional<Bid> findHighestBid(Long auctionItemId) {
        return inMemoryStore.getBids().values().stream()
                .filter(b -> b.getAuctionItemId().equals(auctionItemId))
                .max(Comparator.comparing(Bid::getAmount));
    }

    public Optional<Bid> findSecondHighestBid(Long auctionItemId) {
        List<Bid> bids = inMemoryStore.getBids().values().stream()
                .filter(b -> b.getAuctionItemId().equals(auctionItemId))
                .sorted(Comparator.comparing(Bid::getAmount).reversed())
                .collect(Collectors.toList());
        
        if (bids.size() >= 2) {
            return Optional.of(bids.get(1));
        }
        return Optional.empty();
    }

    public Optional<Bid> findByRequestId(String requestId) {
        return inMemoryStore.getBids().values().stream()
                .filter(b -> requestId.equals(b.getRequestId()))
                .findFirst();
    }

    public Bid placeBid(Long userId, Long auctionItemId, BigDecimal amount, String requestId) {
        if (requestId != null) {
            Optional<Bid> existingBid = findByRequestId(requestId);
            if (existingBid.isPresent()) {
                return existingBid.get();
            }
        }

        AuctionItem item = inMemoryStore.getAuctionItems().get(auctionItemId);
        if (item == null) {
            throw new RuntimeException("拍品不存在");
        }

        if (item.getStatus() != AuctionStatus.ACTIVE) {
            throw new RuntimeException("拍卖未开始或已结束");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(item.getStartTime()) || now.isAfter(item.getEndTime())) {
            throw new RuntimeException("不在拍卖时间范围内");
        }

        if (!depositService.isDepositFrozen(userId, auctionItemId)) {
            throw new RuntimeException("未冻结保证金，不能出价");
        }

        BigDecimal minBidAmount = item.getCurrentPrice().add(item.getIncrementAmount());
        if (amount.compareTo(minBidAmount) < 0) {
            throw new RuntimeException("出价必须高于当前价并满足加价幅度，最低出价为: " + minBidAmount);
        }

        if (item.getWinnerId() != null) {
            throw new RuntimeException("拍品已成交，不能继续出价");
        }

        inMemoryStore.getBids().values().stream()
                .filter(b -> b.getAuctionItemId().equals(auctionItemId) && b.getIsHighest())
                .forEach(b -> b.setIsHighest(false));

        Bid bid = new Bid();
        bid.setId(inMemoryStore.generateBidId());
        bid.setAuctionItemId(auctionItemId);
        bid.setUserId(userId);
        bid.setAmount(amount);
        bid.setRequestId(requestId);
        bid.setBidTime(LocalDateTime.now());
        bid.setIsHighest(true);
        bid.setCreatedAt(LocalDateTime.now());

        inMemoryStore.getBids().put(bid.getId(), bid);

        item.setCurrentPrice(amount);
        item.setUpdatedAt(LocalDateTime.now());

        return bid;
    }

    public int getBidderCount(Long auctionItemId) {
        return (int) inMemoryStore.getBids().values().stream()
                .filter(b -> b.getAuctionItemId().equals(auctionItemId))
                .map(Bid::getUserId)
                .distinct()
                .count();
    }

    public int getBidCount(Long auctionItemId) {
        return (int) inMemoryStore.getBids().values().stream()
                .filter(b -> b.getAuctionItemId().equals(auctionItemId))
                .count();
    }
}
