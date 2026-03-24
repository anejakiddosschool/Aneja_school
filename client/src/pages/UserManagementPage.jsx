
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/userService';

const UserManagementPage = () => {
    // --- State Management ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    // --- Data Fetching ---
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await userService.getAll();
                const sortedUsers = response.data.sort((a, b) => {
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (a.role !== 'admin' && b.role === 'admin') return 1;
                    return a.fullName.localeCompare(b.fullName);
                });
                setUsers(sortedUsers);
            } catch (err) {
                setError('Failed to fetch users. You may not be an authorized admin.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // --- Filtering logic ---
    const filteredUsers = users.filter(user => {
        const query = search.trim().toLowerCase();
        const name = user.fullName?.toLowerCase() || "";
        const homeroom = user.homeroomGrade ? `homeroom: ${user.homeroomGrade}`.toLowerCase() : "";
        const subjects = user.subjectsTaught?.map(a => {
            if (a.subject) return `${a.subject.name} (${a.subject.gradeLevel})`.toLowerCase();
            return "";
        }).join(" ") || "";

        return name.includes(query) || homeroom.includes(query) || subjects.includes(query);
    });

    const handleDelete = async (user) => {
        if (window.confirm(`Are you sure you want to delete ${user.fullName}? This action cannot be undone.`)) {
            try {
                await userService.remove(user._id);
                setUsers((prev) => prev.filter((u) => u._id !== user._id));
            } catch (err) {
                alert("Failed to delete user. Please try again.");
            }
        }
    };

    if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div></div>;
    if (error) return <p className="text-center text-red-600 font-bold bg-red-50 p-4 rounded-xl max-w-lg mx-auto mt-10 shadow-sm border border-red-100">{error}</p>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-fade-in pb-20">
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* HEADER & ACTION BAR */}
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                    {/* Decorative Blur */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl shadow-sm">
                            👥
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900">User Management</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">Manage staff, assign roles, and allocate subjects.</p>
                        </div>
                    </div>

                    <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
                        <Link to="/admin/users/import" className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-5 rounded-xl border border-gray-200 shadow-sm transition-all text-sm">
                            <span>📥</span> Bulk Import
                        </Link>
                        <Link to="/register" className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm shadow-pink-200 transition-all text-sm">
                            <span>➕</span> Add User
                        </Link>
                    </div>
                </div>

                {/* SEARCH BAR & TABLE WRAPPER */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                    
                    {/* TOP CONTROLS */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                                Total: {users.length}
                            </span>
                            <span className="bg-pink-100 text-pink-800 text-xs font-bold px-3 py-1 rounded-full border border-pink-200 shadow-sm">
                                Admins: {users.filter(u => u.role === 'admin').length}
                            </span>
                        </div>
                        
                        <div className="relative w-full sm:w-80">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-sm shadow-sm transition-all"
                                placeholder="Search name or subject..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* USERS TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[11px]">
                                    <th className="py-4 px-6 font-extrabold w-1/4">Staff Member</th>
                                    <th className="py-4 px-4 font-extrabold w-32 text-center">Role</th>
                                    <th className="py-4 px-6 font-extrabold">Academic Assignments</th>
                                    <th className="py-4 px-6 font-extrabold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${user.role === 'admin' ? 'bg-gradient-to-tr from-pink-500 to-rose-400' : 'bg-gradient-to-tr from-slate-600 to-slate-500'}`}>
                                                    {user.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-gray-900 group-hover:text-pink-600 transition-colors">{user.fullName}</p>
                                                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="py-4 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                                                user.role === 'admin' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}>
                                                {user.role === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>}
                                                {user.role}
                                            </span>
                                        </td>
                                        
                                        <td className="py-4 px-6">
                                            <div className="flex flex-wrap gap-2">
                                                {user.homeroomGrade && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm" title="Homeroom Class">
                                                        🏠 Class: {user.homeroomGrade}
                                                    </span>
                                                )}
                                                
                                                {user.subjectsTaught && user.subjectsTaught.length > 0 ? (
                                                    user.subjectsTaught.map(assignment =>
                                                        assignment.subject && (
                                                            <span key={assignment.subject._id} className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200" title="Teaching Subject">
                                                                {assignment.subject.name} <span className="ml-1 text-gray-400">({assignment.subject.gradeLevel})</span>
                                                            </span>
                                                        )
                                                    )
                                                ) : (
                                                    !user.homeroomGrade && user.role !== 'admin' && <span className="text-xs text-gray-400 italic">No subjects assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    to={`/admin/users/${user._id}`}
                                                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                >
                                                    ✎ Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                                >
                                                    ✕ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* EMPTY STATE */}
                    {filteredUsers.length === 0 && (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                            <span className="text-5xl text-gray-300 mb-4">📭</span>
                            <h3 className="text-lg font-bold text-gray-700">No Users Found</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm">We couldn't find any staff member matching your search criteria. Try adjusting your search term.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default UserManagementPage;
