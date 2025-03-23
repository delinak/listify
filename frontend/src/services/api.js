import axios from 'axios';

const API_URL = 'http://localhost:3000/api';  // Using port 3000

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Collections
export const getCollections = (completed) => 
  api.get(`/collections${completed !== undefined ? `?completed=${completed}` : ''}`);

export const createCollection = (data) => 
  api.post('/collections', data);

export const updateCollection = (id, data) => 
  api.put(`/collections/${id}`, data);

export const deleteCollection = (id) => 
  api.delete(`/collections/${id}`);

export const pinCollection = (id) => 
  api.post(`/collections/${id}/pin`);

export const unpinCollection = (id) => 
  api.post(`/collections/${id}/unpin`);

// Entries
export const addEntry = (collectionId, data) => 
  api.post(`/collections/${collectionId}/entries`, data);

export const updateEntry = (id, data) => 
  api.put(`/entries/${id}`, data);

export const deleteEntry = (collectionId, entryId) => 
  api.delete(`/collections/${collectionId}/entries/${entryId}`);

export const toggleEntryCompletion = (collectionId, entryId) =>
  api.put(`/collections/${collectionId}/entries/${entryId}/toggle-completion`);

export const getRandomEntry = (collectionId) =>
  api.get(`/collections/${collectionId}/random-entry`);

export default api; 