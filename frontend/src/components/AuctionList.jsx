import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Tag, Button, Statistic, message, Spin } from 'antd'
import { ClockCircleOutlined, ShopOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { auctionApi } from '../services/api'

const getStatusTag = (status) => {
  const statusMap = {
    DRAFT: { text: '草稿', className: 'status-tag-upcoming' },
    UPCOMING: { text: '即将开始', className: 'status-tag-upcoming' },
    ACTIVE: { text: '竞价中', className: 'status-tag-active' },
    ENDED: { text: '已结束', className: 'status-tag-ended' },
    SOLD: { text: '已成交', className: 'status-tag-sold' },
    CANCELLED: { text: '已取消', className: 'status-tag-ended' },
    REAUCTION: { text: '重新拍卖', className: 'status-tag-upcoming' },
  }
  const info = statusMap[status] || { text: status, className: '' }
  return <Tag className={info.className}>{info.text}</Tag>
}

const AuctionList = ({ currentUser }) => {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadAuctions()
    const interval = setInterval(loadAuctions, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadAuctions = async () => {
    try {
      const response = await auctionApi.getAll()
      if (response.data.code === 200) {
        setAuctions(response.data.data)
      }
    } catch (error) {
      console.error('加载拍品列表失败:', error)
    }
  }

  const handleViewDetail = (id) => {
    navigate(`/auction/${id}`)
  }

  if (loading && auctions.length === 0) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>拍品列表</h2>
      <Row gutter={[24, 24]}>
        {auctions.map(auction => (
          <Col xs={24} sm={12} lg={8} key={auction.id}>
            <Card
              hoverable
              className="auction-card"
              cover={
                <div style={{ 
                  height: 200, 
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {auction.imageUrl ? (
                    <img 
                      src={auction.imageUrl} 
                      alt={auction.name}
                      style={{ maxHeight: '100%', maxWidth: '100%' }}
                    />
                  ) : (
                    <ShopOutlined style={{ fontSize: 64, color: '#ccc' }} />
                  )}
                </div>
              }
              actions={[
                <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(auction.id)}>
                  查看详情
                </Button>
              ]}
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16 }}>{auction.name}</span>
                    {getStatusTag(auction.status)}
                  </div>
                }
                description={
                  <div style={{ marginTop: 12 }}>
                    <p style={{ color: '#666', marginBottom: 8 }}>
                      {auction.description?.substring(0, 50)}...
                    </p>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="起拍价"
                          value={auction.startingPrice}
                          precision={2}
                          prefix="¥"
                          valueStyle={{ fontSize: 16 }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="当前价"
                          value={auction.currentPrice}
                          precision={2}
                          prefix="¥"
                          valueStyle={{ fontSize: 16, color: '#f5222d' }}
                        />
                      </Col>
                    </Row>
                    <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                      <div>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        加价幅度: ¥{auction.incrementAmount} | 保证金: ¥{auction.depositAmount}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        开始时间: {dayjs(auction.startTime).format('MM-DD HH:mm')}
                      </div>
                      <div>
                        结束时间: {dayjs(auction.endTime).format('MM-DD HH:mm')}
                      </div>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
      {auctions.length === 0 && (
        <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
          暂无拍品
        </div>
      )}
    </div>
  )
}

export default AuctionList
