package com.auction.controller;

import com.auction.common.ApiResponse;
import com.auction.entity.AuctionItem;
import com.auction.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auctions")
public class AuctionItemController {

    @Autowired
    private AuctionService auctionService;

    @GetMapping
    public ApiResponse<List<AuctionItem>> getAllAuctionItems() {
        return ApiResponse.success(auctionService.getAllAuctionItems());
    }

    @GetMapping("/{id}")
    public ApiResponse<AuctionItem> getAuctionItemById(@PathVariable Long id) {
        return auctionService.getAuctionItemById(id)
                .map(ApiResponse::success)
                .orElse(ApiResponse.error(404, "拍品不存在"));
    }

    @PostMapping
    public ApiResponse<AuctionItem> createAuctionItem(@RequestBody AuctionItem item) {
        try {
            AuctionItem newItem = auctionService.createAuctionItem(item);
            return ApiResponse.success("拍品创建成功", newItem);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<AuctionItem> updateAuctionItem(
            @PathVariable Long id,
            @RequestBody AuctionItem item) {
        try {
            AuctionItem updatedItem = auctionService.updateAuctionItem(id, item);
            return ApiResponse.success("拍品更新成功", updatedItem);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteAuctionItem(@PathVariable Long id) {
        try {
            auctionService.deleteAuctionItem(id);
            return ApiResponse.success("拍品删除成功", null);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
}
