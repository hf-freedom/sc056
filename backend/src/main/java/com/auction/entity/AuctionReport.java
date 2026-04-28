package com.auction.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AuctionReport {
    private Long id;
    private Long auctionItemId;
    private String itemName;
    private BigDecimal startingPrice;
    private BigDecimal finalPrice;
    private Long winnerId;
    private String winnerName;
    private Integer totalBidders;
    private Integer totalBids;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime auctionStartTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime auctionEndTime;

    private String result;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime reportTime;

    private List<BidSummary> bidSummaries;

    @Data
    public static class BidSummary {
        private Long userId;
        private String userName;
        private BigDecimal amount;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
        private LocalDateTime bidTime;
    }
}
