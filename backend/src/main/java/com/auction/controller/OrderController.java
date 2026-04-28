package com.auction.controller;

import com.auction.common.ApiResponse;
import com.auction.entity.Order;
import com.auction.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/user/{userId}")
    public ApiResponse<List<Order>> getOrdersByUserId(@PathVariable Long userId) {
        return ApiResponse.success(orderService.findByUserId(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<Order> getOrderById(@PathVariable Long id) {
        return orderService.findById(id)
                .map(ApiResponse::success)
                .orElse(ApiResponse.error(404, "订单不存在"));
    }

    @GetMapping("/auction/{auctionItemId}")
    public ApiResponse<Order> getOrderByAuctionItemId(@PathVariable Long auctionItemId) {
        return orderService.findByAuctionItemId(auctionItemId)
                .map(ApiResponse::success)
                .orElse(ApiResponse.error(404, "订单不存在"));
    }

    @PostMapping("/{id}/pay")
    public ApiResponse<Order> payBalance(@PathVariable Long id) {
        try {
            Order order = orderService.payBalance(id);
            return ApiResponse.success("支付成功", order);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
}
