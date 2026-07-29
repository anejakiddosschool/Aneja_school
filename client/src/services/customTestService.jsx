// src/services/customTestService.js
import api from './api';

const API_URL = '/custom-tests';

// Create a new custom test
const createCustomTest = (data) => {
    return api.post(API_URL, data);
};

// Get all custom tests (optional filters)
const getCustomTests = (params = {}) => {
    return api.get(API_URL, { params });
};

// Get a single custom test by ID
const getCustomTestById = (id) => {
    return api.get(`${API_URL}/${id}`);
};

// Delete a custom test
const deleteCustomTest = (id) => {
    return api.delete(`${API_URL}/${id}`);
};

// Get students with existing scores for a test
const getTestStudents = (testId) => {
    return api.get(`${API_URL}/${testId}/students`);
};

// Save marks for students
const saveTestMarks = (testId, scores) => {
    return api.post(`${API_URL}/${testId}/marks`, { scores });
};

// Generate PDF for a single student
const generateStudentPdf = (testId, studentId) => {
    return api.get(`${API_URL}/${testId}/pdf/${studentId}`, {
        responseType: 'blob'
    });
};

// Send PDF to a single parent via WhatsApp
const sendPdfToParent = (testId, studentId) => {
    return api.post(`${API_URL}/${testId}/send/${studentId}`);
};

// Send PDF to ALL parents via WhatsApp
const sendPdfToAllParents = (testId) => {
    return api.post(`${API_URL}/${testId}/send-all`);
};

// Send PDF to SELECTED parents via WhatsApp
const sendPdfToSelectedParents = (testId, studentIds) => {
    return api.post(`${API_URL}/${testId}/send-selected`, { studentIds });
};

export default {
    createCustomTest,
    getCustomTests,
    getCustomTestById,
    deleteCustomTest,
    getTestStudents,
    saveTestMarks,
    generateStudentPdf,
    sendPdfToParent,
    sendPdfToSelectedParents,
    sendPdfToAllParents
};
