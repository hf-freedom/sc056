package com.auction.service;

import com.auction.entity.AuctionItem;
import com.auction.entity.Deposit;
import com.auction.entity.User;
import com.auction.entity.enums.AuctionStatus;
import com.auction.entity.enums.DepositStatus;
import com.auction.repository.InMemoryStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DepositService {

    @Autowired
    private InMemoryStore inMemoryStore;

    public Optional<Deposit> findByUserIdAndAuctionItemId(Long userId, Long auctionItemId) {
        return inMemoryStore.getDeposits().values().stream()
                .filter(d -> d.getUserId().equals(userId) && d.getAuctionItemId().equals(auctionItemId))
                .findFirst();
    }

    public List<Deposit> findByAuctionItemId(Long auctionItemId) {
        return inMemoryStore.getDeposits().values().stream()
                .filter(d -> d.getAuctionItemId().equals(auctionItemId))
                .collect(Collectors.toList());
    }

    public List<Deposit> findByUserId(Long userId) {
        return inMemoryStore.getDeposits().values().stream()
                .filter(d -> d.getUserId().equals(userId))
                .collect(Collectors.toList());
    }

    public Deposit freezeDeposit(Long userId, Long auctionItemId) {
        User user = inMemoryStore.getUsers().get(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        AuctionItem item = inMemoryStore.getAuctionItems().get(auctionItemId);
        if (item == null) {
            throw new RuntimeException("拍品不存在");
        }

        if (item.getStatus() == AuctionStatus.ENDED || item.getStatus() == AuctionStatus.SOLD) {
            throw new RuntimeException("拍卖已结束，无法报名");
        }

        Optional<Deposit> existingDeposit = findByUserIdAndAuctionItemId(userId, auctionItemId);
        if (existingDeposit.isPresent()) {
            if (existingDeposit.get().getStatus() == DepositStatus.FROZEN) {
                return existingDeposit.get();
            }
            throw new RuntimeException("保证金状态异常");
        }

        BigDecimal depositAmount = item.getDepositAmount();
        if (user.getBalance().compareTo(depositAmount) < 0) {
            throw new RuntimeException("余额不足，无法冻结保证金");
        }

        user.setBalance(user.getBalance().subtract(depositAmount));
        user.setUpdatedAt(LocalDateTime.now());

        Deposit deposit = new Deposit();
        deposit.setId(inMemoryStore.generateDepositId());
        deposit.setUserId(userId);
        deposit.setAuctionItemId(auctionItemId);
        deposit.setAmount(depositAmount);
        deposit.setStatus(DepositStatus.FROZEN);
        deposit.setFrozenTime(LocalDateTime.now());
        deposit.setCreatedAt(LocalDateTime.now());
        deposit.setUpdatedAt(LocalDateTime.now());

        inMemoryStore.getDeposits().put(deposit.getId(), deposit);

        return deposit;
    }

    public void releaseDeposit(Deposit deposit) {
        if (deposit.getStatus() != DepositStatus.FROZEN) {
            return;
        }

        User user = inMemoryStore.getUsers().get(deposit.getUserId());
        if (user == null) {
            return;
        }

        user.setBalance(user.getBalance().add(deposit.getAmount()));
        user.setUpdatedAt(LocalDateTime.now());

        deposit.setStatus(DepositStatus.RELEASED);
        deposit.setReleasedTime(LocalDateTime.now());
        deposit.setUpdatedAt(LocalDateTime.now());
    }

    public void releaseDepositsForAuction(Long auctionItemId, Long excludeUserId) {
        List<Deposit> deposits = findByAuctionItemId(auctionItemId);
        for (Deposit deposit : deposits) {
            if (!deposit.getUserId().equals(excludeUserId) && deposit.getStatus() == DepositStatus.FROZEN) {
                releaseDeposit(deposit);
            }
        }
    }

    public void deductDeposit(Deposit deposit) {
        if (deposit.getStatus() != DepositStatus.FROZEN) {
            return;
        }

        deposit.setStatus(DepositStatus.DEDUCTED);
        deposit.setUpdatedAt(LocalDateTime.now());
    }

    public void convertDepositToPayment(Deposit deposit) {
        if (deposit.getStatus() != DepositStatus.FROZEN) {
            return;
        }

        deposit.setStatus(DepositStatus.CONVERTED);
        deposit.setUpdatedAt(LocalDateTime.now());
    }

    public boolean isDepositFrozen(Long userId, Long auctionItemId) {
        return findByUserIdAndAuctionItemId(userId, auctionItemId)
                .map(d -> d.getStatus() == DepositStatus.FROZEN)
                .orElse(false);
    }
}
