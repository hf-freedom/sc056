package com.auction.config;

import com.auction.entity.AuctionItem;
import com.auction.entity.User;
import com.auction.entity.enums.AuctionStatus;
import com.auction.repository.InMemoryStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private InMemoryStore inMemoryStore;

    @Override
    public void run(String... args) {
        initUsers();
        initAuctionItems();
    }

    private void initUsers() {
        User user1 = new User();
        user1.setId(inMemoryStore.generateUserId());
        user1.setUsername("user1");
        user1.setNickname("买家张三");
        user1.setBalance(new BigDecimal("100000.00"));
        user1.setCreatedAt(LocalDateTime.now());
        user1.setUpdatedAt(LocalDateTime.now());
        inMemoryStore.getUsers().put(user1.getId(), user1);

        User user2 = new User();
        user2.setId(inMemoryStore.generateUserId());
        user2.setUsername("user2");
        user2.setNickname("买家李四");
        user2.setBalance(new BigDecimal("80000.00"));
        user2.setCreatedAt(LocalDateTime.now());
        user2.setUpdatedAt(LocalDateTime.now());
        inMemoryStore.getUsers().put(user2.getId(), user2);

        User user3 = new User();
        user3.setId(inMemoryStore.generateUserId());
        user3.setUsername("user3");
        user3.setNickname("买家王五");
        user3.setBalance(new BigDecimal("150000.00"));
        user3.setCreatedAt(LocalDateTime.now());
        user3.setUpdatedAt(LocalDateTime.now());
        inMemoryStore.getUsers().put(user3.getId(), user3);
    }

    private void initAuctionItems() {
        LocalDateTime now = LocalDateTime.now();

        AuctionItem item1 = new AuctionItem();
        item1.setId(inMemoryStore.generateAuctionItemId());
        item1.setName("清代青花瓷瓶");
        item1.setDescription("清代乾隆年间青花瓷瓶，保存完好，高约30cm，瓶身绘有精美图案。");
        item1.setImageUrl("https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Qing%20Dynasty%20blue%20and%20white%20porcelain%20vase%20antique%20Chinese%20art&image_size=square_hd");
        item1.setStartingPrice(new BigDecimal("50000.00"));
        item1.setCurrentPrice(new BigDecimal("50000.00"));
        item1.setIncrementAmount(new BigDecimal("1000.00"));
        item1.setDepositAmount(new BigDecimal("5000.00"));
        item1.setStartTime(now.minusMinutes(5));
        item1.setEndTime(now.plusHours(2));
        item1.setStatus(AuctionStatus.ACTIVE);
        item1.setCreatedAt(now);
        item1.setUpdatedAt(now);
        inMemoryStore.getAuctionItems().put(item1.getId(), item1);

        AuctionItem item2 = new AuctionItem();
        item2.setId(inMemoryStore.generateAuctionItemId());
        item2.setName("限量版手表");
        item2.setDescription("瑞士名牌限量版机械手表，全球限量100只，附原厂证书和包装盒。");
        item2.setImageUrl("https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20limited%20edition%20mechanical%20wristwatch%20Swiss%20made&image_size=square_hd");
        item2.setStartingPrice(new BigDecimal("20000.00"));
        item2.setCurrentPrice(new BigDecimal("20000.00"));
        item2.setIncrementAmount(new BigDecimal("500.00"));
        item2.setDepositAmount(new BigDecimal("2000.00"));
        item2.setStartTime(now.minusMinutes(10));
        item2.setEndTime(now.plusHours(1));
        item2.setStatus(AuctionStatus.ACTIVE);
        item2.setCreatedAt(now);
        item2.setUpdatedAt(now);
        inMemoryStore.getAuctionItems().put(item2.getId(), item2);

        AuctionItem item3 = new AuctionItem();
        item3.setId(inMemoryStore.generateAuctionItemId());
        item3.setName("名人字画真迹");
        item3.setDescription("著名画家真迹作品，尺寸约60x90cm，已装裱，附鉴定证书。");
        item3.setImageUrl("https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20Chinese%20calligraphy%20and%20painting%20artwork%20framed&image_size=square_hd");
        item3.setStartingPrice(new BigDecimal("100000.00"));
        item3.setCurrentPrice(new BigDecimal("100000.00"));
        item3.setIncrementAmount(new BigDecimal("5000.00"));
        item3.setDepositAmount(new BigDecimal("10000.00"));
        item3.setStartTime(now.plusMinutes(30));
        item3.setEndTime(now.plusHours(3));
        item3.setStatus(AuctionStatus.UPCOMING);
        item3.setCreatedAt(now);
        item3.setUpdatedAt(now);
        inMemoryStore.getAuctionItems().put(item3.getId(), item3);
    }
}
