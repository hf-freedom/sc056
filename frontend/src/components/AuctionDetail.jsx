import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  InputNumber,
  Tag,
  List,
  Avatar,
  Descriptions,
  Modal,
  message,
  Spin,
  Divider,
  Badge,
} from 'antd'
import {
  ShopOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { auctionApi, depositApi, bidApi, userApi } from '../services/api'

const getStatusTag = (status) => {
  const statusMap = {
    DRAFT: { text: '草稿', color: 'default' },
    UPCOMING: { text: '即将开始', color: 'blue' },
    ACTIVE: { text: '竞价中', color: 'green' },
    ENDED: { text: '已结束', color: 'orange' },
    SOLD: { text: '已成交', color: 'red' },
    CANCELLED: { text: '已取消', color: 'default' },
    REAUCTION: { text: '重新拍卖', color: 'blue' },
  }
  const info = statusMap[status] || { text: status, color: 'default' }
  return <Tag color={info.color}>{info.text}</Tag>
}

const AuctionDetail = ({ currentUser }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [auction, setAuction] = useState(null)
  const [bids, setBids] = useState([])
  const [users, setUsers] = useState({})
  const [loading, setLoading] = useState(false)
  const [depositStatus, setDepositStatus] = useState(false)
  const [bidAmount, setBidAmount] = useState(0)
  const [countdown, setCountdown] = useState('')
  const requestIdRef = useRef(null)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id, currentUser])

  useEffect(() => {
    if (!auction) return
    
    const updateCountdown = () => {
      const now = dayjs()
      const endTime = dayjs(auction.endTime)
      const startTime = dayjs(auction.startTime)

      if (now.isBefore(startTime)) {
        const diff = startTime.diff(now)
        setCountdown(`距离开始: ${formatDuration(diff)}`)
      } else if (now.isBefore(endTime)) {
        const diff = endTime.diff(now)
        setCountdown(`距离结束: ${formatDuration(diff)}`)
      } else {
        setCountdown('拍卖已结束')
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [auction])

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [auctionRes, bidsRes, usersRes] = await Promise.all([
        auctionApi.getById(id),
        bidApi.getByAuctionId(id),
        userApi.getAll(),
      ])

      if (auctionRes.data.code === 200) {
        setAuction(auctionRes.data.data)
        setBidAmount(
          parseFloat(auctionRes.data.data.currentPrice) + 
          parseFloat(auctionRes.data.data.incrementAmount)
        )
      }

      if (bidsRes.data.code === 200) {
        setBids(bidsRes.data.data)
      }

      if (usersRes.data.code === 200) {
        const userMap = {}
        usersRes.data.data.forEach(u => {
          userMap[u.id] = u
        })
        setUsers(userMap)
      }

      if (currentUser) {
        const depositRes = await depositApi.checkStatus(currentUser.id, id)
        if (depositRes.data.code === 200) {
          setDepositStatus(depositRes.data.data.isFrozen)
        }
      }
    } catch (error) {
      message.error('加载数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFreezeDeposit = async () => {
    if (!currentUser) {
      message.warning('请先选择用户')
      return
    }

    try {
      const res = await depositApi.freeze(currentUser.id, auction.id)
      if (res.data.code === 200) {
        message.success('保证金冻结成功')
        setDepositStatus(true)
      } else {
        message.error(res.data.message)
      }
    } catch (error) {
      message.error(error.response?.data?.message || '冻结保证金失败')
    }
  }

  const handlePlaceBid = async () => {
    if (!currentUser) {
      message.warning('请先选择用户')
      return
    }

    if (!depositStatus) {
      message.warning('请先冻结保证金')
      return
    }

    const minBid = parseFloat(auction.currentPrice) + parseFloat(auction.incrementAmount)
    if (bidAmount < minBid) {
      message.error(`出价必须至少为 ¥${minBid}`)
      return
    }

    requestIdRef.current = `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const res = await bidApi.place(
        currentUser.id,
        auction.id,
        bidAmount,
        requestIdRef.current
      )
      if (res.data.code === 200) {
        message.success('出价成功')
        loadData()
        setBidAmount(bidAmount + parseFloat(auction.incrementAmount))
      } else {
        message.error(res.data.message)
      }
    } catch (error) {
      message.error(error.response?.data?.message || '出价失败')
    }
  }

  const isBiddingActive = auction && 
    auction.status === 'ACTIVE' && 
    dayjs().isBefore(dayjs(auction.endTime))

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
  }

  if (!auction) {
    return <div style={{ textAlign: 'center', padding: 50 }}>拍品不存在</div>
  }

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card>
            <div style={{ 
              height: 400, 
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderRadius: 8,
              overflow: 'hidden'
            }}>
              {auction.imageUrl ? (
                <img 
                  src={auction.imageUrl} 
                  alt={auction.name}
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              ) : (
                <ShopOutlined style={{ fontSize: 100, color: '#ccc' }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>{auction.name}</h2>
              {getStatusTag(auction.status)}
            </div>

            <p style={{ color: '#666', marginBottom: 16 }}>{auction.description}</p>

            <Divider />

            <Descriptions column={2} bordered>
              <Descriptions.Item label="起拍价">¥{auction.startingPrice}</Descriptions.Item>
              <Descriptions.Item label="当前价">
                <span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: 16 }}>
                  ¥{auction.currentPrice}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="加价幅度">¥{auction.incrementAmount}</Descriptions.Item>
              <Descriptions.Item label="保证金">¥{auction.depositAmount}</Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {dayjs(auction.startTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {dayjs(auction.endTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="操作区" style={{ marginBottom: 16 }}>
            {currentUser ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <Avatar icon={<UserOutlined />} style={{ marginRight: 12 }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{currentUser.nickname}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      余额: ¥{currentUser.balance}
                    </div>
                  </div>
                </div>

                <Divider />

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <span>保证金状态:</span>
                    {depositStatus ? (
                      <Tag color="green" icon={<LockOutlined />}>已冻结</Tag>
                    ) : (
                      <Tag color="orange" icon={<UnlockOutlined />}>未冻结</Tag>
                    )}
                  </div>
                  {!depositStatus && isBiddingActive && (
                    <Button 
                      type="primary" 
                      block
                      onClick={handleFreezeDeposit}
                    >
                      冻结保证金 (¥{auction.depositAmount})
                    </Button>
                  )}
                </div>

                <Divider />

                {countdown && (
                  <div className="countdown" style={{ textAlign: 'center', marginBottom: 16 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {countdown}
                  </div>
                )}

                {isBiddingActive && depositStatus && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 8 }}>
                        <span>最低出价: </span>
                        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                          ¥{parseFloat(auction.currentPrice) + parseFloat(auction.incrementAmount)}
                        </span>
                      </div>
                      <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        min={parseFloat(auction.currentPrice) + parseFloat(auction.incrementAmount)}
                        step={parseFloat(auction.incrementAmount)}
                        precision={2}
                        prefix="¥"
                        value={bidAmount}
                        onChange={setBidAmount}
                      />
                    </div>
                    <Button 
                      type="primary" 
                      size="large"
                      block
                      icon={<ShopOutlined />}
                      onClick={handlePlaceBid}
                    >
                      出价
                    </Button>
                  </div>
                )}

                {!isBiddingActive && (
                  <div style={{ textAlign: 'center', color: '#999' }}>
                    拍卖未开始或已结束
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999' }}>
                请在顶部选择用户
              </div>
            )}
          </Card>

          <Card title="出价记录">
            {bids.length > 0 ? (
              <List
                className="bid-list"
                dataSource={bids}
                renderItem={(bid, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge count={index + 1} showZero />
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            {users[bid.userId]?.nickname || '用户' + bid.userId}
                            {bid.isHighest && <Tag color="green" style={{ marginLeft: 8 }}>当前最高</Tag>}
                          </span>
                          <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                            ¥{bid.amount}
                          </span>
                        </div>
                      }
                      description={dayjs(bid.bidTime).format('YYYY-MM-DD HH:mm:ss')}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                暂无出价记录
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AuctionDetail
