import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Layout, Menu, Select, Avatar, Card, Typography, message } from 'antd'
import {
  ShopOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { userApi } from './services/api'
import AuctionList from './components/AuctionList'
import AuctionDetail from './components/AuctionDetail'
import OrderList from './components/OrderList'
import ReportList from './components/ReportList'
import AuctionManage from './components/AuctionManage'

const { Header, Sider, Content } = Layout
const { Title } = Typography
const { Option } = Select

const App = () => {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await userApi.getAll()
      if (response.data.code === 200) {
        setUsers(response.data.data)
        if (response.data.data.length > 0) {
          setCurrentUser(response.data.data[0])
        }
      }
    } catch (error) {
      message.error('加载用户列表失败')
    }
  }

  const handleUserChange = (userId) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setCurrentUser(user)
      message.success(`已切换到用户: ${user.nickname}`)
    }
  }

  const menuItems = [
    {
      key: '/',
      icon: <ShopOutlined />,
      label: <Link to="/">拍品列表</Link>,
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/orders">我的订单</Link>,
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: <Link to="/reports">成交报表</Link>,
    },
    {
      key: '/manage',
      icon: <SettingOutlined />,
      label: <Link to="/manage">拍品管理</Link>,
    },
  ]

  return (
    <Layout className="auction-layout">
      <Header className="auction-header">
        <div className="logo">
          <ShopOutlined style={{ marginRight: 8 }} />
          在线拍卖系统
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Select
            placeholder="选择用户"
            style={{ width: 200 }}
            value={currentUser?.id}
            onChange={handleUserChange}
            size="large"
          >
            {users.map(user => (
              <Option key={user.id} value={user.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>{user.nickname}</span>
                  <span style={{ color: '#999', fontSize: 12 }}>余额: ¥{user.balance}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>
      </Header>
      <Layout>
        <Sider width={200} theme="light" style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['/']}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Content className="auction-content">
          <Routes>
            <Route path="/" element={<AuctionList currentUser={currentUser} />} />
            <Route path="/auction/:id" element={<AuctionDetail currentUser={currentUser} />} />
            <Route path="/orders" element={<OrderList currentUser={currentUser} />} />
            <Route path="/reports" element={<ReportList />} />
            <Route path="/manage" element={<AuctionManage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

export default AppWrapper
