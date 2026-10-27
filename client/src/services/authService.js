import API from './api'

export const signup = (data) => API.post('/auth/signup', data)
export const login = (data) => API.post('/auth/login', data)
export const getMe = () => API.get('/auth/me')
export const updateProfile = (data) => API.put('/auth/profile', data)
export const changePassword = (data) => API.put('/auth/password', data)
export const getAccountStats = () => API.get('/auth/stats')
export const forgotPassword = (data) => API.post('/auth/forgot-password', data)
export const resetPassword = (token, data) => API.post(`/auth/reset-password/${token}`, data)
export const deleteUserAccount = () => API.delete('/auth/delete-account')
