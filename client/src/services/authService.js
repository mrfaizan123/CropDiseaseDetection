import API from './api.js';

export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (name, email, password, phone) => {
  const response = await API.post('/auth/register', { name, email, password, phone });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await API.put('/auth/update', data);
  return response.data;
};