import api from './api';

const API_URL = '/foundation-tests';

const createFoundationTest = (data) => api.post(API_URL, data);
const getFoundationTests = (params = {}) => api.get(API_URL, { params });
const getFoundationTestDetail = (id) => api.get(`${API_URL}/${id}`);
const getFoundationTestStudents = (id, params = {}) => api.get(`${API_URL}/${id}/students`, { params });
const saveFoundationTestMarks = (id, subjectId, scores) => api.post(`${API_URL}/${id}/marks`, { subjectId, scores });
const sendMergedPdf = (id, studentIds) => api.post(`${API_URL}/${id}/send`, { studentIds });
const downloadMergedPdf = (id, studentId) => api.get(`${API_URL}/${id}/download/${studentId}`, { responseType: 'blob' });
// Preview PDF (fetch as blob so auth token goes through)
const previewMergedPdf = async (id, studentId) => {
    const url = studentId
        ? `${API_URL}/${id}/preview/${studentId}`
        : `${API_URL}/${id}/preview`;
    const res = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
};
const deleteFoundationTest = (id) => api.delete(`${API_URL}/${id}`);

export default {
  createFoundationTest,
  getFoundationTests,
  getFoundationTestDetail,
  getFoundationTestStudents,
  saveFoundationTestMarks,
  sendMergedPdf,
  downloadMergedPdf,
  previewMergedPdf,
  deleteFoundationTest,
};
