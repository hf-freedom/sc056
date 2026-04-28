import React, { useState, useEffect } from 'react'
import { Table, Card, Statistic, Row, Col, Tag, Descriptions, Collapse, Empty, Spin, message, List, Avatar } from 'antd'
import { TrophyOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { reportApi } from '../services/api'

const { Panel } = Collapse

const ReportList = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await reportApi.getAll()
      if (res.data.code === 200) {
        setReports(res.data.data)
      }
    } catch (error) {
      message.error('加载报表失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '拍品名称',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            拍卖编号: {record.auctionItemId}
          </div>
        </div>
      ),
    },
    {
      title: '起拍价',
      dataIndex: 'startingPrice',
      key: 'startingPrice',
      render: (price) => <span>¥{price}</span>,
    },
    {
      title: '成交价',
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      render: (price, record) => (
        <span style={{ color: record.result === '成交' ? '#f5222d' : '#666', fontWeight: 'bold' }}>
          ¥{price}
        </span>
      ),
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result) => (
        <Tag color={result === '成交' ? 'green' : 'orange'} icon={result === '成交' ? <TrophyOutlined /> : null}>
          {result}
        </Tag>
      ),
    },
    {
      title: '中标者',
      dataIndex: 'winnerName',
      key: 'winnerName',
      render: (name, record) => name || (record.result === '流拍' ? '-' : '未知'),
    },
    {
      title: '参与人数',
      dataIndex: 'totalBidders',
      key: 'totalBidders',
    },
    {
      title: '出价次数',
      dataIndex: 'totalBids',
      key: 'totalBids',
    },
    {
      title: '拍卖时间',
      key: 'time',
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>开始: {dayjs(record.auctionStartTime).format('MM-DD HH:mm')}</div>
          <div>结束: {dayjs(record.auctionEndTime).format('MM-DD HH:mm')}</div>
        </div>
      ),
    },
    {
      title: '报表生成时间',
      dataIndex: 'reportTime',
      key: 'reportTime',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  const expandedRowRender = (record) => {
    return (
      <Card size="small" style={{ margin: '0 16px' }}>
        <Row gutter={24}>
          <Col span={12}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="拍品名称">{record.itemName}</Descriptions.Item>
              <Descriptions.Item label="起拍价">¥{record.startingPrice}</Descriptions.Item>
              <Descriptions.Item label="成交价">¥{record.finalPrice}</Descriptions.Item>
              <Descriptions.Item label="拍卖结果">
                <Tag color={record.result === '成交' ? 'green' : 'orange'}>
                  {record.result}
                </Tag>
              </Descriptions.Item>
              {record.winnerName && (
                <Descriptions.Item label="中标者">{record.winnerName}</Descriptions.Item>
              )}
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="参与人数">{record.totalBidders} 人</Descriptions.Item>
              <Descriptions.Item label="出价次数">{record.totalBids} 次</Descriptions.Item>
              <Descriptions.Item label="拍卖开始时间">
                {dayjs(record.auctionStartTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="拍卖结束时间">
                {dayjs(record.auctionEndTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="报表生成时间">
                {dayjs(record.reportTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        {record.bidSummaries && record.bidSummaries.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ marginBottom: 12 }}>出价记录详情</h4>
            <List
              size="small"
              bordered
              dataSource={record.bidSummaries}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%',
                        background: index === 0 ? '#52c41a' : '#1890ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: 12
                      }}>
                        {index + 1}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          {item.userName || '用户' + item.userId}
                          {index === 0 && <Tag color="green" style={{ marginLeft: 8 }}>最高出价</Tag>}
                        </span>
                        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                          ¥{item.amount}
                        </span>
                      </div>
                    }
                    description={dayjs(item.bidTime).format('YYYY-MM-DD HH:mm:ss')}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>成交报表</h2>
      
      {reports.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总拍卖场次"
                value={reports.length}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="成交场次"
                value={reports.filter(r => r.result === '成交').length}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="流拍场次"
                value={reports.filter(r => r.result === '流拍').length}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总参与人数"
                value={reports.reduce((sum, r) => sum + (r.totalBidders || 0), 0)}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandedRowRender={expandedRowRender}
          locale={{
            emptyText: (
              <Empty description="暂无成交报表" />
            ),
          }}
        />
      </Card>
    </div>
  )
}

export default ReportList
