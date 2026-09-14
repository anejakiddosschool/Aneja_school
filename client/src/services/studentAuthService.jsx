import api from './api';

// Helper to get the student/parent token config
const getStudentAuthConfig = () => {
    const studentUser = JSON.parse(localStorage.getItem('student-user'));
    if (studentUser && studentUser.token) {
        return { headers: { Authorization: `Bearer ${studentUser.token}` } };
    }
    return {};
};

// Public
const login = (studentId, password) => api.post(`/student-auth/login`, { studentId, password });

// Protected
const changePassword = (newPassword) => {
    return api.put('/student-auth/change-password', { newPassword }, getStudentAuthConfig());
};

// Update the parent contact phone (used for WhatsApp OTP recovery)
const updatePhone = (phone) => {
    return api.put('/student-auth/phone', { phone }, getStudentAuthConfig());
};

// Local storage functions
const logout = () => localStorage.removeItem('student-user');
const getCurrentStudent = () => JSON.parse(localStorage.getItem('student-user'));

export default { login, changePassword, updatePhone, logout, getCurrentStudent };