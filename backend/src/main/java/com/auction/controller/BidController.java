package com.auction.controller;

import com.auction.common.ApiResponse;
import com.auction.entity.Bid;
import com.auction.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/bids")
public class BidController {

    @Autowired
    private BidService bidService;

    @GetMapping("/auction/{auctionItemId}")
    public ApiResponse<List<Bid>> getBidsByAuctionItemId(@PathVariable Long auctionItemId) {
        return ApiResponse.success(bidService.findByAuctionItemId(auctionItemId));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<Bid>> getBidsByUserId(@PathVariable Long userId) {
        return ApiResponse.success(bidService.findByUserId(userId));
    }

    @GetMapping("/highest/{auctionItemId}")
    public ApiResponse<Bid> getHighestBid(@PathVariable Long auctionItemId) {
        Optional<Bid> bid = bidService.findHighestBid(auctionItemId);
        return bid.map(ApiResponse::success)
                .orElse(ApiResponse.error(404, "暂无出价记录"));
    }

    @PostMapping
    public ApiResponse<Bid> placeBid(@RequestBody Map<String, Object> request) {
        try {
            Long userId = ((Number) request.get("userId")).longValue();
            Long auctionItemId = ((Number) request.get("auctionItemId")).longValue();
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            String requestId = (String) request.get("requestId");

            Bid bid = bidService.placeBid(userId, auctionItemId, amount, requestId);
            return ApiResponse.success("出价成功", bid);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
}
