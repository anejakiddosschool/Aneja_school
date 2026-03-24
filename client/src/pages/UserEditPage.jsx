
// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import userService from '../services/userService';
// import subjectService from '../services/subjectService';

// const UserEditPage = () => {
//     const { id: userId } = useParams();
//     const navigate = useNavigate();

//     // --- State Management ---
//     const [user, setUser] = useState(null);
//     const [allSubjects, setAllSubjects] = useState([]);
//     const [assignedSubjects, setAssignedSubjects] = useState(new Set());
//     const [isHomeroom, setIsHomeroom] = useState(false);
//     const [homeroomGrade, setHomeroomGrade] = useState('');
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     // --- New States for Search/Filter ---
//     const [searchTerm, setSearchTerm] = useState("");
//     const [filterGrade, setFilterGrade] = useState("");

//     // --- Data Fetching ---
//     useEffect(() => {
//         const loadData = async () => {
//             try {
//                 const [userRes, subjectsRes] = await Promise.all([
//                     userService.getById(userId),
//                     subjectService.getAllSubjects()
//                 ]);
//                 const userData = userRes.data;
//                 setUser(userData);
//                 setAllSubjects(subjectsRes.data.data);
//                 setIsHomeroom(!!userData.homeroomGrade);
//                 setHomeroomGrade(userData.homeroomGrade || '');
//                 const assignedIds = new Set(userData.subjectsTaught.map(item => item.subject?._id).filter(Boolean));
//                 setAssignedSubjects(assignedIds);
//             } catch (err) {
//                 setError('Failed to load user and subject data.');
//             } finally {
//                 setLoading(false);
//             }
//         };
//         loadData();
//     }, [userId]);

//     // --- Event Handlers ---
//     const handleCheckboxChange = (subjectId) => {
//         const newAssignedSubjects = new Set(assignedSubjects);
//         if (newAssignedSubjects.has(subjectId)) {
//             newAssignedSubjects.delete(subjectId);
//         } else {
//             newAssignedSubjects.add(subjectId);
//         }
//         setAssignedSubjects(newAssignedSubjects);
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         const updatedSubjectsTaught = Array.from(assignedSubjects).map(id => ({ subject: id }));
//         const updatePayload = {
//             subjectsTaught: updatedSubjectsTaught,
//             homeroomGrade: isHomeroom ? homeroomGrade : "" 
//         };
//         try {
//             await userService.update(userId, updatePayload);
//             alert('User updated successfully!');
//             navigate('/admin/users');
//         } catch (err) {
//             if (err.response && err.response.data && err.response.data.message) {
//                 setError(err.response.data.message);
//             } else {
//                 setError('An unexpected error occurred. Failed to update user.');
//             }
//             console.error(err.message);
//         }
//     };

//     if (loading) return <p className="text-center text-lg mt-8">Loading user for editing...</p>;
   
//     // --- Tailwind CSS class strings ---
//     const fieldset = "border border-gray-300 p-4 rounded-lg";
//     const legend = "font-bold text-lg text-gray-700 px-2";
//     const textInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
//     const submitButton = "w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200";

//     // --- Filter Subjects ---
//     const filteredSubjects = allSubjects.filter(subject => {
//         const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase());
//         const matchesGrade = filterGrade ? subject.gradeLevel.toLowerCase() === filterGrade.toLowerCase() : true;
//         return matchesSearch && matchesGrade;
//     });

//     // --- Collect unique gradeLevels for dropdown ---
//     const uniqueGrades = [...new Set(allSubjects.map(sub => sub.gradeLevel))];

//     return (
//         <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
//             <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit User: {user?.fullName}</h2>
//             <Link to="/admin/users" className="text-pink-500 hover:underline mb-6 block">
//                 ← Back to User List
//             </Link>
            
//             {user && !loading && (
//                 <form onSubmit={handleSubmit}>
//                     <div className="space-y-6">
                 
// <fieldset className={fieldset}>
//   <legend className={legend}>Homeroom Duties</legend>
//   <label className="flex items-center space-x-3 p-2 cursor-pointer">
//     <input
//       type="checkbox"
//       className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
//       checked={isHomeroom}
//       onChange={(e) => setIsHomeroom(e.target.checked)}
//     />
//     <span className="text-gray-700">Assign as Homeroom Teacher</span>
//   </label>

//   {isHomeroom && (
//     <div className="mt-4 pl-8">
//       <label htmlFor="homeroomGrade" className="block text-gray-700 text-sm font-bold mb-2">
//         Homeroom Grade Level
//       </label>
//       <select
//         id="homeroomGrade"
//         className={textInput}
//         value={homeroomGrade}
//         onChange={(e) => setHomeroomGrade(e.target.value)}
//         required
//       >
//         <option value="">-- Select Grade --</option>
//         {uniqueGrades.map((grade) => (
//           <option key={grade} value={grade}>
//             {grade}
//           </option>
//         ))}
//       </select>
//     </div>
//   )}
// </fieldset>

//                         {/* --- Subject Assignment Section --- */}
//                         {user.role === 'teacher' && (
//                              <fieldset className={fieldset}>
//                                 <legend className={legend}>Assign Subjects to Teach</legend>

//                                 {/* --- Search & Filter Controls --- */}
//                                 <div className="flex flex-col md:flex-row gap-4 mb-4">
//                                     <input
//                                         type="text"
//                                         placeholder="Search by subject name..."
//                                         value={searchTerm}
//                                         onChange={(e) => setSearchTerm(e.target.value)}
//                                         className="flex-1 shadow border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
//                                     />
//                                     <select
//                                         value={filterGrade}
//                                         onChange={(e) => setFilterGrade(e.target.value)}
//                                         className="shadow border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
//                                     >
//                                         <option value="">All Grades</option>
//                                         {uniqueGrades.map(grade => (
//                                             <option key={grade} value={grade}>{grade}</option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 {/* --- Subjects List --- */}
//                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-2">
//                                     {filteredSubjects.length > 0 ? (
//                                         filteredSubjects.map(subject => (
//                                             <label key={subject._id} className="flex items-center space-x-3 cursor-pointer">
//                                                 <input
//                                                     type="checkbox"
//                                                     className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
//                                                     checked={assignedSubjects.has(subject._id)}
//                                                     onChange={() => handleCheckboxChange(subject._id)}
//                                                 />
//                                                 <span className="text-gray-700">{subject.name} ({subject.gradeLevel})</span>
//                                             </label>
//                                         ))
//                                     ) : (
//                                         <p className="text-gray-500 col-span-full">No subjects found.</p>
//                                     )}
//                                 </div>
//                             </fieldset>
//                         )}
//                     </div>
                    
//                     {error && <p className="text-red-500 mt-2">{error}</p>}
                    
//                     <div className="mt-8 flex justify-end">
//                         <button type="submit" className={submitButton}>Save Changes</button>
//                     </div>
//                 </form>
//             )}
//         </div>
//     );
// };

// export default UserEditPage;


// src/pages/UserEditPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';
import subjectService from '../services/subjectService';

const UserEditPage = () => {
    const { id: userId } = useParams();
    const navigate = useNavigate();

    // --- State Management ---
    const [user, setUser] = useState(null);
    const [allSubjects, setAllSubjects] = useState([]);
    const [assignedSubjects, setAssignedSubjects] = useState(new Set());
    const [isHomeroom, setIsHomeroom] = useState(false);
    const [homeroomGrade, setHomeroomGrade] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- New States for Search/Filter ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGrade, setFilterGrade] = useState("");

    // --- Data Fetching ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [userRes, subjectsRes] = await Promise.all([
                    userService.getById(userId),
                    subjectService.getAllSubjects()
                ]);
                const userData = userRes.data;
                setUser(userData);
                setAllSubjects(subjectsRes.data.data);
                setIsHomeroom(!!userData.homeroomGrade);
                setHomeroomGrade(userData.homeroomGrade || '');
                const assignedIds = new Set(userData.subjectsTaught.map(item => item.subject?._id).filter(Boolean));
                setAssignedSubjects(assignedIds);
            } catch (err) {
                setError('Failed to load user and subject data.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userId]);

    // --- Event Handlers ---
    const handleCheckboxChange = (subjectId) => {
        const newAssignedSubjects = new Set(assignedSubjects);
        if (newAssignedSubjects.has(subjectId)) {
            newAssignedSubjects.delete(subjectId);
        } else {
            newAssignedSubjects.add(subjectId);
        }
        setAssignedSubjects(newAssignedSubjects);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const updatedSubjectsTaught = Array.from(assignedSubjects).map(id => ({ subject: id }));
        const updatePayload = {
            subjectsTaught: updatedSubjectsTaught,
            homeroomGrade: isHomeroom ? homeroomGrade : "" 
        };
        try {
            await userService.update(userId, updatePayload);
            navigate('/admin/users');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('An unexpected error occurred. Failed to update user.');
            }
        }
    };

    // --- Filter Subjects ---
    const filteredSubjects = allSubjects.filter(subject => {
        const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = filterGrade ? subject.gradeLevel.toLowerCase() === filterGrade.toLowerCase() : true;
        return matchesSearch && matchesGrade;
    });

    const uniqueGrades = [...new Set(allSubjects.map(sub => sub.gradeLevel))];

    if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-fade-in pb-20">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* BACK LINK */}
                <Link to="/admin/users" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-pink-600 transition-colors">
                    <span className="mr-1">←</span> Back to User List
                </Link>

                {/* USER PROFILE HEADER */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                        {user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-800">{user?.fullName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">{user?.username}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${user?.role === 'admin' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                {user?.role}
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-sm text-sm font-semibold">
                        ⚠️ {error}
                    </div>
                )}

                {/* EDIT FORM */}
                {user && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* HOMEROOM DUTIES CARD */}
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                                <span>🏠</span> Homeroom Duties
                            </h3>
                            
                            <label className="flex items-center gap-3 cursor-pointer group w-max">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 transition-all cursor-pointer"
                                        checked={isHomeroom}
                                        onChange={(e) => setIsHomeroom(e.target.checked)}
                                    />
                                </div>
                                <span className="text-gray-700 font-semibold group-hover:text-pink-600 transition-colors">Assign as Homeroom Teacher</span>
                            </label>

                            {isHomeroom && (
                                <div className="mt-5 pl-8 animate-fade-in">
                                    <label htmlFor="homeroomGrade" className="block text-gray-600 text-sm font-bold mb-2 uppercase tracking-wide">
                                        Select Grade Level
                                    </label>
                                    <select
                                        id="homeroomGrade"
                                        className="w-full md:w-1/2 border border-gray-300 rounded-xl py-2.5 px-4 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 hover:bg-white transition-colors"
                                        value={homeroomGrade}
                                        onChange={(e) => setHomeroomGrade(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose Class --</option>
                                        {uniqueGrades.map((grade) => (
                                            <option key={grade} value={grade}>{grade}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* SUBJECT ASSIGNMENTS CARD */}
                        {user.role === 'teacher' && (
                            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b border-gray-100 pb-4 gap-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <span>📚</span> Academic Assignments
                                    </h3>
                                    
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <div className="relative flex-1 md:w-48">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs">🔍</span>
                                            <input
                                                type="text"
                                                placeholder="Search subject..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                                            />
                                        </div>
                                        <select
                                            value={filterGrade}
                                            onChange={(e) => setFilterGrade(e.target.value)}
                                            className="text-sm border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 cursor-pointer"
                                        >
                                            <option value="">All Grades</option>
                                            {uniqueGrades.map(grade => (
                                                <option key={grade} value={grade}>{grade}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredSubjects.length > 0 ? (
                                        filteredSubjects.map(subject => {
                                            const isChecked = assignedSubjects.has(subject._id);
                                            return (
                                                <label 
                                                    key={subject._id} 
                                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                        isChecked ? 'border-pink-500 bg-pink-50/30 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-pink-200 hover:bg-white'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                                                        checked={isChecked}
                                                        onChange={() => handleCheckboxChange(subject._id)}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-bold ${isChecked ? 'text-pink-700' : 'text-gray-700'}`}>{subject.name}</span>
                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Class {subject.gradeLevel}</span>
                                                    </div>
                                                </label>
                                            )
                                        })
                                    ) : (
                                        <div className="col-span-full py-8 text-center text-gray-400">
                                            <span className="text-3xl block mb-2">📭</span>
                                            <p className="text-sm">No subjects found matching your filter.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-end">
                            <button 
                                type="submit" 
                                className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                            >
                                Save Assignments
                            </button>
                        </div>

                    </form>
                )}
            </div>
        </div>
    );
};

export default UserEditPage;
