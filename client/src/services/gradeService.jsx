import api from './api';
const API_URL = '/grades';

// Get all grade entries for a specific student
const getGradesByStudent = (studentId) => {
    return api.get(`${API_URL}/student/${studentId}`);
};

const getGradeById = (gradeId) => {
    return api.get(`${API_URL}/${gradeId}`);
};

const createGrade = (gradeData) => {
    return api.post(API_URL, gradeData);
};

const deleteGrade = (gradeId) => {
    return api.delete(`${API_URL}/${gradeId}`);
};

const updateGrade = (gradeId, gradeData) => {
    return api.put(`${API_URL}/${gradeId}`, gradeData); 
};

// 🌟 FIX IS HERE: Dono variables pass karne hain aur params object me bhejney hain!
const getGradeSheet = (assessmentTypeId, academicYear) => {
    return api.get(`${API_URL}/sheet`, { 
        params: { assessmentTypeId, academicYear } 
    });
};

const saveGradeSheet = (data) => {
    return api.post(`${API_URL}/sheet`, data);
};

const getGradeDetails = ({ studentId, subjectId, semester, academicYear }) => {
    return api.get(`${API_URL}/details`, {
        params: { studentId, subjectId, semester, academicYear }
    });
};

export default { 
    getGradesByStudent, 
    createGrade, 
    deleteGrade, 
    getGradeById, 
    updateGrade, 
    getGradeSheet, 
    saveGradeSheet, 
    getGradeDetails 
};
