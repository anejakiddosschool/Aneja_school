// src/services/classService.js
import api from './api';

const API_URL = '/classes';

const getAllGrades = () => {
    return api.get(`${API_URL}/grades`);
};

const getAllSections = (gradeLevel) => {
    const params = gradeLevel ? { gradeLevel } : {};
    return api.get(`${API_URL}/sections`, { params });
};

const createGrade = (gradeLevel) => {
    return api.post(`${API_URL}/grades`, { gradeLevel });
};

const deleteGrade = (gradeLevel) => {
    return api.delete(`${API_URL}/grades/${encodeURIComponent(gradeLevel)}`);
};

const createSection = (gradeLevel, name) => {
    return api.post(`${API_URL}/sections`, { gradeLevel, name });
};

const deleteSection = (id) => {
    return api.delete(`${API_URL}/sections/${id}`);
};

export default {
    getAllGrades,
    getAllSections,
    createGrade,
    deleteGrade,
    createSection,
    deleteSection
};
