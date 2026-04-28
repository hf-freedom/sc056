package com.auction.repository;

import com.auction.entity.*;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class InMemoryStore {

    private final AtomicLong userIdCounter = new AtomicLong(1);
    private final AtomicLong auctionItemIdCounter = new AtomicLong(1);
    private final AtomicLong bidIdCounter = new AtomicLong(1);
    private final AtomicLong depositIdCounter = new AtomicLong(1);
    private final AtomicLong orderIdCounter = new AtomicLong(1);
    private final AtomicLong reportIdCounter = new AtomicLong(1);

    private final Map<Long, User> users = new ConcurrentHashMap<>();
    private final Map<Long, AuctionItem> auctionItems = new ConcurrentHashMap<>();
    private final Map<Long, Bid> bids = new ConcurrentHashMap<>();
    private final Map<Long, Deposit> deposits = new ConcurrentHashMap<>();
    private final Map<Long, Order> orders = new ConcurrentHashMap<>();
    private final Map<Long, AuctionReport> reports = new ConcurrentHashMap<>();

    public Long generateUserId() {
        return userIdCounter.getAndIncrement();
    }

    public Long generateAuctionItemId() {
        return auctionItemIdCounter.getAndIncrement();
    }

    public Long generateBidId() {
        return bidIdCounter.getAndIncrement();
    }

    public Long generateDepositId() {
        return depositIdCounter.getAndIncrement();
    }

    public Long generateOrderId() {
        return orderIdCounter.getAndIncrement();
    }

    public Long generateReportId() {
        return reportIdCounter.getAndIncrement();
    }

    public Map<Long, User> getUsers() {
        return users;
    }

    public Map<Long, AuctionItem> getAuctionItems() {
        return auctionItems;
    }

    public Map<Long, Bid> getBids() {
        return bids;
    }

    public Map<Long, Deposit> getDeposits() {
        return deposits;
    }

    public Map<Long, Order> getOrders() {
        return orders;
    }

    public Map<Long, AuctionReport> getReports() {
        return reports;
    }
}
