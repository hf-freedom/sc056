package com.auction.service;

import com.auction.entity.AuctionItem;
import com.auction.entity.AuctionReport;
import com.auction.entity.Bid;
import com.auction.entity.User;
import com.auction.repository.InMemoryStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private InMemoryStore inMemoryStore;

    @Autowired
    private BidService bidService;

    public AuctionReport generateReport(AuctionItem item, Bid highestBid) {
        AuctionReport report = new AuctionReport();
        report.setId(inMemoryStore.generateReportId());
        report.setAuctionItemId(item.getId());
        report.setItemName(item.getName());
        report.setStartingPrice(item.getStartingPrice());
        report.setFinalPrice(highestBid.getAmount());
        report.setWinnerId(highestBid.getUserId());

        User winner = inMemoryStore.getUsers().get(highestBid.getUserId());
        if (winner != null) {
            report.setWinnerName(winner.getNickname());
        }

        report.setTotalBidders(bidService.getBidderCount(item.getId()));
        report.setTotalBids(bidService.getBidCount(item.getId()));
        report.setAuctionStartTime(item.getStartTime());
        report.setAuctionEndTime(item.getEndTime());
        report.setResult("成交");
        report.setReportTime(LocalDateTime.now());
        report.setBidSummaries(generateBidSummaries(item.getId()));

        inMemoryStore.getReports().put(report.getId(), report);

        return report;
    }

    public AuctionReport generateNoBidReport(AuctionItem item) {
        AuctionReport report = new AuctionReport();
        report.setId(inMemoryStore.generateReportId());
        report.setAuctionItemId(item.getId());
        report.setItemName(item.getName());
        report.setStartingPrice(item.getStartingPrice());
        report.setFinalPrice(item.getStartingPrice());
        report.setTotalBidders(0);
        report.setTotalBids(0);
        report.setAuctionStartTime(item.getStartTime());
        report.setAuctionEndTime(item.getEndTime());
        report.setResult("流拍");
        report.setReportTime(LocalDateTime.now());
        report.setBidSummaries(Collections.emptyList());

        inMemoryStore.getReports().put(report.getId(), report);

        return report;
    }

    private List<AuctionReport.BidSummary> generateBidSummaries(Long auctionItemId) {
        return bidService.findByAuctionItemId(auctionItemId).stream()
                .sorted(Comparator.comparing(Bid::getAmount).reversed())
                .map(bid -> {
                    AuctionReport.BidSummary summary = new AuctionReport.BidSummary();
                    summary.setUserId(bid.getUserId());
                    summary.setAmount(bid.getAmount());
                    summary.setBidTime(bid.getBidTime());

                    User user = inMemoryStore.getUsers().get(bid.getUserId());
                    if (user != null) {
                        summary.setUserName(user.getNickname());
                    }

                    return summary;
                })
                .collect(Collectors.toList());
    }

    public List<AuctionReport> getAllReports() {
        return inMemoryStore.getReports().values().stream()
                .sorted(Comparator.comparing(AuctionReport::getReportTime).reversed())
                .collect(Collectors.toList());
    }

    public AuctionReport getReportByAuctionItemId(Long auctionItemId) {
        return inMemoryStore.getReports().values().stream()
                .filter(r -> r.getAuctionItemId().equals(auctionItemId))
                .findFirst()
                .orElse(null);
    }
}
