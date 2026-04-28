package com.auction.controller;

import com.auction.common.ApiResponse;
import com.auction.entity.AuctionReport;
import com.auction.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping
    public ApiResponse<List<AuctionReport>> getAllReports() {
        return ApiResponse.success(reportService.getAllReports());
    }

    @GetMapping("/auction/{auctionItemId}")
    public ApiResponse<AuctionReport> getReportByAuctionItemId(@PathVariable Long auctionItemId) {
        AuctionReport report = reportService.getReportByAuctionItemId(auctionItemId);
        if (report != null) {
            return ApiResponse.success(report);
        }
        return ApiResponse.error(404, "报表不存在");
    }
}
