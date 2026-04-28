import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
}

export const auctionApi = {
  getAll: () => api.get('/auctions'),
  getById: (id) => api.get(`/auctions/${id}`),
  create: (data) => api.post('/auctions', data),
  update: (id, data) => api.put(`/auctions/${id}`, data),
  delete: (id) => api.delete(`/auctions/${id}`),
}

export const depositApi = {
  getByUserId: (userId) => api.get(`/deposits/user/${userId}`),
  getByAuctionId: (auctionId) => api.get(`/deposits/auction/${auctionId}`),
  checkStatus: (userId, auctionId) => 
    api.get('/deposits/check', { params: { userId, auctionItemId: auctionId } }),
  freeze: (userId, auctionItemId) => 
    api.post('/deposits/freeze', { userId, auctionItemId }),
}

export const bidApi = {
  getByAuctionId: (auctionId) => api.get(`/bids/auction/${auctionId}`),
  getByUserId: (userId) => api.get(`/bids/user/${userId}`),
  getHighest: (auctionId) => api.get(`/bids/highest/${auctionId}`),
  place: (userId, auctionItemId, amount, requestId) => 
    api.post('/bids', { userId, auctionItemId, amount, requestId }),
}

export const orderApi = {
  getByUserId: (userId) => api.get(`/orders/user/${userId}`),
  getById: (id) => api.get(`/orders/${id}`),
  getByAuctionId: (auctionId) => api.get(`/orders/auction/${auctionId}`),
  pay: (orderId) => api.post(`/orders/${orderId}/pay`),
}

export const reportApi = {
  getAll: () => api.get('/reports'),
  getByAuctionId: (auctionId) => api.get(`/reports/auction/${auctionId}`),
}

export default api
