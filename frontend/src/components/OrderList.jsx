import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Card, message, Statistic, Descriptions, Modal, Spin, Empty } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi, auctionApi } from '../services/api'

const getStatusTag = (status) => {
  const statusMap = {
    CREATED: { text: '已创建', color: 'default', icon: null },
    AWAITING_PAYMENT: { text: '待支付尾款', color: 'orange', icon: <ClockCircleOutlined /> },
    PAID: { text: '已支付', color: 'blue', icon: <CheckCircleOutlined /> },
    COMPLETED: { text: '已完成', color: 'green', icon: <CheckCircleOutlined /> },
    CANCELLED: { text: '已取消', color: 'default', icon: <CloseCircleOutlined /> },
    DEFAULTED: { text: '违约', color: 'red', icon: <ExclamationCircleOutlined /> },
  }
  const info = statusMap[status] || { text: status, color: 'default', icon: null }
  return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>
}

const OrderList = ({ currentUser }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [auctions, setAuctions] = useState({})

  useEffect(() => {
    if (currentUser) {
      loadOrders()
    }
  }, [currentUser])

  const loadOrders = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
      const orderRes = await orderApi.getByUserId(currentUser.id)
      if (orderRes.data.code === 200) {
        setOrders(orderRes.data.data)
        
        const auctionIds = [...new Set(orderRes.data.data.map(o => o.auctionItemId))]
        const auctionMap = {}
        for (const id of auctionIds) {
          try {
            const res = await auctionApi.getById(id)
            if (res.data.code === 200) {
              auctionMap[id] = res.data.data
            }
          } catch (e) {
            console.error(e)
          }
        }
        setAuctions(auctionMap)
      }
    } catch (error) {
      message.error('加载订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async (order) => {
    Modal.confirm({
      title: '确认支付尾款',
      content: (
        <div>
          <p>拍品: {auctions[order.auctionItemId]?.name || order.auctionItemId}</p>
          <p>订单金额: ¥{order.totalAmount}</p>
          <p>保证金已抵扣: ¥{order.depositAmount}</p>
          <p>需支付尾款: <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{order.balanceAmount}</span></p>
        </div>
      ),
      okText: '确认支付',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await orderApi.pay(order.id)
          if (res.data.code === 200) {
            message.success('支付成功')
            loadOrders()
          } else {
            message.error(res.data.message)
          }
        } catch (error) {
          message.error(error.response?.data?.message || '支付失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
    },
    {
      title: '拍品',
      dataIndex: 'auctionItemId',
      key: 'itemName',
      render: (id) => auctions[id]?.name || '拍品' + id,
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => <span style={{ fontWeight: 'bold' }}>¥{amount}</span>,
    },
    {
      title: '保证金抵扣',
      dataIndex: 'depositAmount',
      key: 'depositAmount',
      render: (amount) => `¥${amount}`,
    },
    {
      title: '应付尾款',
      dataIndex: 'balanceAmount',
      key: 'balanceAmount',
      render: (amount, record) => (
        <span style={{ color: record.status === 'AWAITING_PAYMENT' ? '#f5222d' : '#666' }}>
          ¥{amount}
        </span>
      ),
    },
    {
      title: '支付截止时间',
      dataIndex: 'balancePaymentDeadline',
      key: 'deadline',
      render: (time) => {
        const now = dayjs()
        const deadline = dayjs(time)
        const isOverdue = now.isAfter(deadline)
        return (
          <span style={{ color: isOverdue ? '#f5222d' : '#666' }}>
            {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
          </span>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'AWAITING_PAYMENT') {
          const now = dayjs()
          const deadline = dayjs(record.balancePaymentDeadline)
          const isOverdue = now.isAfter(deadline)
          
          if (!isOverdue) {
            return (
              <Button type="primary" size="small" onClick={() => handlePay(record)}>
                支付尾款
              </Button>
            )
          }
        }
        return null
      },
    },
  ]

  if (!currentUser) {
    return (
      <Card>
        <div style={{ textAlign: 'center', color: '#999', padding: 50 }}>
          请在顶部选择用户查看订单
        </div>
      </Card>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>我的订单</h2>
      
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty description="暂无订单" />
            ),
          }}
        />
      </Card>
    </div>
  )
}

export default OrderList
