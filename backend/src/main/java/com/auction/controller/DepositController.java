package com.auction.controller;

import com.auction.common.ApiResponse;
import com.auction.entity.Deposit;
import com.auction.service.DepositService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deposits")
public class DepositController {

    @Autowired
    private DepositService depositService;

    @GetMapping("/user/{userId}")
    public ApiResponse<List<Deposit>> getDepositsByUserId(@PathVariable Long userId) {
        return ApiResponse.success(depositService.findByUserId(userId));
    }

    @GetMapping("/auction/{auctionItemId}")
    public ApiResponse<List<Deposit>> getDepositsByAuctionItemId(@PathVariable Long auctionItemId) {
        return ApiResponse.success(depositService.findByAuctionItemId(auctionItemId));
    }

    @GetMapping("/check")
    public ApiResponse<Map<String, Object>> checkDepositStatus(
            @RequestParam Long userId,
            @RequestParam Long auctionItemId) {
        boolean isFrozen = depositService.isDepositFrozen(userId, auctionItemId);
        Map<String, Object> result = new HashMap<>();
        result.put("isFrozen", isFrozen);
        return ApiResponse.success(result);
    }

    @PostMapping("/freeze")
    public ApiResponse<Deposit> freezeDeposit(@RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            Long auctionItemId = request.get("auctionItemId");
            Deposit deposit = depositService.freezeDeposit(userId, auctionItemId);
            return ApiResponse.success("保证金冻结成功", deposit);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
}
