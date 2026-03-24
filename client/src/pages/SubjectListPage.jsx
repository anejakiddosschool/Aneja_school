

// // src/pages/SubjectListPage.js
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import subjectService from '../services/subjectService';

// const SubjectListPage = () => {
//   // --- State Management ---
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchedGrade, setSearchedGrade] = useState('');
//   const [subjects, setSubjects] = useState([]);
//   const [filteredSubjects, setFilteredSubjects] = useState([]);
//   const [gradeOptions, setGradeOptions] = useState([]); // ✅ new: unique grade levels
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // States for the "Add New" form
//   const [newSubjectName, setNewSubjectName] = useState('');
//   const [newSubjectCode, setNewSubjectCode] = useState('');

//   // --- Fetch all subjects once ---
//   useEffect(() => {
//     const fetchSubjects = async () => {
//       setLoading(true);
//       try {
//         const response = await subjectService.getAllSubjects(); // fetch all
//         const allSubjects = response.data.data;
//         setSubjects(allSubjects);

//         // ✅ extract unique grade levels
//         const uniqueGrades = [...new Set(allSubjects.map((s) => s.gradeLevel))];
//         setGradeOptions(uniqueGrades);
//       } catch (err) {
//         setError('Failed to fetch subjects.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchSubjects();
//   }, []);

//   // --- Event Handlers ---
//   const handleSearch = (e) => {
//     if (e) e.preventDefault();
//     if (!searchTerm) {
//       setError('Please select a grade level.');
//       return;
//     }
//     setError(null);
//     setSearchedGrade(searchTerm);

//     // Filter locally
//     const results = subjects.filter(
//       (sub) => sub.gradeLevel && sub.gradeLevel === searchTerm
//     );
//     setFilteredSubjects(results);
//   };

//   const handleCreate = async (e) => {
//     e.preventDefault();
//     try {
//       const newSubjectData = {
//         name: newSubjectName,
//         code: newSubjectCode,
//         gradeLevel: searchedGrade,
//       };
//       await subjectService.createSubject(newSubjectData);
//       setNewSubjectName('');
//       setNewSubjectCode('');

//       // Optimistically update frontend state
//       setFilteredSubjects((prev) => [...prev, newSubjectData]);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to create subject.');
//     }
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm('Are you sure you want to delete this subject?')) {
//       try {
//         await subjectService.deleteSubject(id);
//         setFilteredSubjects((prev) => prev.filter((sub) => sub._id !== id));
//       } catch (err) {
//         setError('Failed to delete subject.');
//       }
//     }
//   };

//   // --- Tailwind CSS class strings ---
//   const textInput =
//     'shadow-sm border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500';
//   const buttonPink =
//     'bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200';
//   const buttonGreen =
//     'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200';

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold text-gray-800 mb-4">
//         Subject Management
//       </h2>

//       {/* --- Search Form --- */}
//       <div className="p-4 bg-gray-50 rounded-lg border mb-6">
//         <form
//           onSubmit={handleSearch}
//           className="flex flex-wrap items-center gap-4"
//         >
//           <div>
//             <label
//               htmlFor="gradeSearch"
//               className="font-bold text-gray-700 mr-2"
//             >
//               Select Grade Level:
//             </label>
//             <select
//               id="gradeSearch"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="shadow-sm border rounded-lg py-2 px-3 text-gray-700"
//               required
//             >
//               <option value="">Choose Grade</option>
//               {gradeOptions.map((grade) => (
//                 <option key={grade} value={grade}>
//                   {grade}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <button type="submit" className={buttonPink} disabled={loading}>
//             {loading ? 'Searching...' : 'Load Subjects'}
//           </button>
//           <Link to="/subjects/import" className={`${buttonGreen} ml-auto`}>
//             Import from Excel
//           </Link>
//         </form>
//       </div>

//       {error && <p className="text-red-500 text-center mb-4">{error}</p>}

//       {/* --- Results and Add Form Section --- */}
//       {searchedGrade && !loading && (
//         <div className="mt-6">
//           <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
//             Subjects for "{searchedGrade}"
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {/* Left Column: List of Subjects */}
//             <div>
//               <h4 className="font-bold text-gray-700 mb-2">Existing Subjects</h4>
//               {filteredSubjects.length > 0 ? (
//                 <ul className="list-disc list-inside space-y-2">
//                   {filteredSubjects.map((sub) => (
//                     <li
//                       key={sub._id || sub.name}
//                       className="flex justify-between items-center bg-gray-50 p-2 rounded"
//                     >
//                       <span>
//                         {sub.name} {sub.code && `(${sub.code})`}
//                       </span>
//                       <button
//                         onClick={() => handleDelete(sub._id)}
//                         className="text-red-500 hover:text-red-700 text-sm font-medium"
//                       >
//                         Delete
//                       </button>
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">
//                   No subjects found for this grade level yet.
//                 </p>
//               )}
//             </div>

//             {/* Right Column: Add New Subject Form */}
//             <div>
//               <form
//                 onSubmit={handleCreate}
//                 className="bg-gray-50 p-4 rounded-lg border"
//               >
//                 <h4 className="font-bold text-gray-700 mb-2">
//                   Add New Subject to "{searchedGrade}"
//                 </h4>
//                 <div>
//                   <label className="text-sm">Subject Name</label>
//                   <input
//                     type="text"
//                     value={newSubjectName}
//                     onChange={(e) => setNewSubjectName(e.target.value)}
//                     placeholder="e.g., Mathematics"
//                     className={textInput}
//                     required
//                   />
//                 </div>
//                 <div className="mt-4">
//                   <label className="text-sm">Subject Code (Optional)</label>
//                   <input
//                     type="text"
//                     value={newSubjectCode}
//                     onChange={(e) => setNewSubjectCode(e.target.value)}
//                     placeholder="e.g., MATH-01"
//                     className={textInput}
//                   />
//                 </div>
//                 <button type="submit" className={`w-full mt-4 ${buttonGreen}`}>
//                   + Add Subject
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SubjectListPage;


// src/pages/SubjectListPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import subjectService from '../services/subjectService';
import toast from 'react-hot-toast';

const SubjectListPage = () => {
  // --- State Management ---
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection/Search states
  const [selectedGrade, setSelectedGrade] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Initial Data Load ---
  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await subjectService.getAllSubjects();
      setAllSubjects(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch subjects from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // --- Derived Data (Optimized via useMemo) ---
  const gradeOptions = useMemo(() => {
    const uniqueGrades = new Set(allSubjects.map((s) => s.gradeLevel).filter(Boolean));
    return Array.from(uniqueGrades).sort();
  }, [allSubjects]);

  const filteredSubjects = useMemo(() => {
    let result = allSubjects;
    
    // Filter by Dropdown Grade
    if (selectedGrade) {
      result = result.filter(sub => sub.gradeLevel === selectedGrade);
    }
    
    // Filter by Text Search
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(sub => 
        sub.name.toLowerCase().includes(lowerQuery) || 
        (sub.code && sub.code.toLowerCase().includes(lowerQuery)) ||
        (sub.gradeLevel && sub.gradeLevel.toLowerCase().includes(lowerQuery))
      );
    }
    
    return result;
  }, [allSubjects, selectedGrade, searchQuery]);

  // --- Event Handlers ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedGrade) {
      toast.error("Please select a Grade Level from the top filter first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newSubjectData = {
        name: newSubjectName,
        code: newSubjectCode,
        gradeLevel: selectedGrade,
      };
      
      const res = await subjectService.createSubject(newSubjectData);
      
      // Reset form
      setNewSubjectName('');
      setNewSubjectCode('');
      
      // Update state with server response (which includes _id)
      setAllSubjects(prev => [...prev, res.data.data || newSubjectData]);
      toast.success(`${newSubjectName} added successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await subjectService.deleteSubject(id);
        setAllSubjects(prev => prev.filter((sub) => sub._id !== id));
        toast.success('Subject deleted successfully.');
      } catch (err) {
        toast.error('Failed to delete subject. It might be in use.');
      }
    }
  };

  // --- Render logic ---
  if (loading) {
    return <div className="flex justify-center items-center mt-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Subject Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage subjects and course codes across all classes.</p>
        </div>
        <Link 
          to="/subjects/import" 
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <span>📥</span> Import from Excel
        </Link>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Grade Dropdown */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Filter by Class/Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all cursor-pointer"
            >
              <option value="">-- All Classes --</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          {/* Text Search */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Search Subjects</label>
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all outline-none"
            />
          </div>

        </div>
      </div>

      {/* CONTENT SPLIT (Requires a class to be selected to Add, but can view all) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/MAIN: SUBJECT LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
            
            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-800">
                {selectedGrade ? `Subjects for "${selectedGrade}"` : "All Registered Subjects"}
              </h3>
              <span className="text-sm font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {filteredSubjects.length} found
              </span>
            </div>

            {filteredSubjects.length > 0 ? (
              <ul className="space-y-3">
                {filteredSubjects.map((sub) => (
                  <li
                    key={sub._id || sub.name}
                    className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 border border-gray-100 p-3 rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="font-bold text-gray-800 text-[15px]">{sub.name}</div>
                      <div className="flex gap-2 mt-1">
                        {!selectedGrade && <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{sub.gradeLevel}</span>}
                        {sub.code && <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Code: {sub.code}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(sub._id, sub.name)}
                      className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-bold opacity-80 group-hover:opacity-100 transition-all"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">📚</span>
                <p className="text-gray-500 font-medium">No subjects found.</p>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedGrade 
                    ? "Use the form on the right to add subjects for this class." 
                    : "Try adjusting your search filters."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ADD SUBJECT FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
            
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-pink-100 text-pink-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">+</span>
              Create Subject
            </h4>

            {!selectedGrade ? (
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
                ⚠️ Please select a <strong>Class/Grade</strong> from the top filter before adding a new subject.
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 mb-2">
                  Adding to: <strong className="block text-base mt-0.5">{selectedGrade}</strong>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Subject Name *</label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g., Mathematics"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Subject Code (Optional)</label>
                  <input
                    type="text"
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    placeholder="e.g., MATH-01"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none uppercase"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all mt-4"
                >
                  {isSubmitting ? "Adding..." : "+ Add Subject"}
                </button>
              </form>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default SubjectListPage;
