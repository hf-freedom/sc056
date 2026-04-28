import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { auctionApi } from '../services/api'

const { TextArea } = Input
const { RangePicker } = DatePicker

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

const canEdit = (status) => {
  return status === 'UPCOMING' || status === 'DRAFT'
}

const canDelete = (status) => {
  return status !== 'ACTIVE'
}

const AuctionManage = () => {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadAuctions()
  }, [])

  const loadAuctions = async () => {
    setLoading(true)
    try {
      const response = await auctionApi.getAll()
      if (response.data.code === 200) {
        setAuctions(response.data.data)
      }
    } catch (error) {
      message.error('加载拍品列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      startingPrice: 10000,
      incrementAmount: 1000,
      depositAmount: 1000,
    })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      imageUrl: record.imageUrl,
      startingPrice: parseFloat(record.startingPrice),
      incrementAmount: parseFloat(record.incrementAmount),
      depositAmount: parseFloat(record.depositAmount),
      timeRange: [
        dayjs(record.startTime),
        dayjs(record.endTime),
      ],
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const response = await auctionApi.delete(id)
      if (response.data.code === 200) {
        message.success('删除成功')
        loadAuctions()
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const data = {
        name: values.name,
        description: values.description,
        imageUrl: values.imageUrl,
        startingPrice: values.startingPrice,
        incrementAmount: values.incrementAmount,
        depositAmount: values.depositAmount,
        startTime: values.timeRange[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.timeRange[1].format('YYYY-MM-DD HH:mm:ss'),
      }

      let response
      if (editingItem) {
        response = await auctionApi.update(editingItem.id, data)
      } else {
        response = await auctionApi.create(data)
      }

      if (response.data.code === 200) {
        message.success(editingItem ? '更新成功' : '创建成功')
        setModalVisible(false)
        loadAuctions()
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '拍品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.description?.substring(0, 40)}...
          </div>
        </div>
      ),
    },
    {
      title: '起拍价',
      dataIndex: 'startingPrice',
      key: 'startingPrice',
      width: 100,
      render: (price) => <span>¥{price}</span>,
    },
    {
      title: '当前价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      render: (price, record) => (
        <span style={{ color: record.currentPrice > record.startingPrice ? '#f5222d' : '#666' }}>
          ¥{price}
        </span>
      ),
    },
    {
      title: '加价幅度',
      dataIndex: 'incrementAmount',
      key: 'incrementAmount',
      width: 100,
      render: (amount) => <span>¥{amount}</span>,
    },
    {
      title: '保证金',
      dataIndex: 'depositAmount',
      key: 'depositAmount',
      width: 100,
      render: (amount) => <span>¥{amount}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '拍卖时间',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>开始: {dayjs(record.startTime).format('MM-DD HH:mm')}</div>
          <div>结束: {dayjs(record.endTime).format('MM-DD HH:mm')}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!canEdit(record.status)}
            title={!canEdit(record.status) ? '只有即将开始的拍品可以编辑' : '编辑'}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个拍品吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={!canDelete(record.status)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDelete(record.status)}
              title={!canDelete(record.status) ? '正在进行的拍品不能删除' : '删除'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const stats = {
    total: auctions.length,
    upcoming: auctions.filter(a => a.status === 'UPCOMING').length,
    active: auctions.filter(a => a.status === 'ACTIVE').length,
    sold: auctions.filter(a => a.status === 'SOLD').length,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>拍品管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增拍品
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总拍品数"
              value={stats.total}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="即将开始"
              value={stats.upcoming}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="正在竞价"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已成交"
              value={stats.sold}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={auctions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑拍品' : '新增拍品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="拍品名称"
            rules={[{ required: true, message: '请输入拍品名称' }]}
          >
            <Input placeholder="请输入拍品名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="拍品描述"
          >
            <TextArea rows={4} placeholder="请输入拍品描述" />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="图片链接"
          >
            <Input placeholder="请输入图片URL（可选）" />
          </Form.Item>

          <Form.Item
            name="startingPrice"
            label="起拍价（元）"
            rules={[
              { required: true, message: '请输入起拍价' },
              { type: 'number', min: 0.01, message: '起拍价必须大于0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={100}
              precision={2}
              placeholder="请输入起拍价"
            />
          </Form.Item>

          <Form.Item
            name="incrementAmount"
            label="加价幅度（元）"
            rules={[
              { required: true, message: '请输入加价幅度' },
              { type: 'number', min: 0.01, message: '加价幅度必须大于0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={100}
              precision={2}
              placeholder="请输入加价幅度"
            />
          </Form.Item>

          <Form.Item
            name="depositAmount"
            label="保证金（元）"
            rules={[
              { required: true, message: '请输入保证金' },
              { type: 'number', min: 0, message: '保证金不能为负数' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              precision={2}
              placeholder="请输入保证金"
            />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="拍卖时间"
            rules={[{ required: true, message: '请选择拍卖时间' }]}
          >
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AuctionManage
