// import React, { useState, useEffect, useMemo } from "react";
// import subjectService from "../services/subjectService";
// import assessmentTypeService from "../services/assessmentTypeService";
// import authService from "../services/authService";
// import userService from "../services/userService";

// // Define months array for sorting and dropdown
// const MONTHS = [
//   "September",
//   "October",
//   "November",
//   "December",
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
// ];

// const AssessmentTypesPage = () => {
//   // --- State Management ---
//   const [currentUser] = useState(authService.getCurrentUser());
//   const [subjects, setSubjects] = useState([]);
//   const [selectedSubject, setSelectedSubject] = useState(null);
//   const [assessmentTypes, setAssessmentTypes] = useState([]);
//   const [newAssessmentSemester, setNewAssessmentSemester] = useState("");
//   const [newAssessmentName, setNewAssessmentName] = useState("");
//   const [newAssessmentMarks, setNewAssessmentMarks] = useState("");
//   const [newAssessmentMonth, setNewAssessmentMonth] = useState("");

//   const ASSESSMENT_TYPES = [
//     "Periodic Test-I",
//     "Periodic Test-II",
//     "Periodic Test-III",
//     "Periodic Test-IV",
//     "SA-I",
//     "SA-II",
//     "Class Test",
//     "NTSE",
//   ];

//   // UI feedback + loading states
//   const [error, setError] = useState("");
//   const [pageLoading, setPageLoading] = useState(true);
//   const [assessmentsLoading, setAssessmentsLoading] = useState(false);

//   // Search states
//   const [subjectSearch, setSubjectSearch] = useState("");
//   const [search, setSearch] = useState(""); // For assessment type search

//   // --- Load subjects per user role ---
//   useEffect(() => {
//     const loadSubjectsForRole = async () => {
//       setError("");
//       try {
//         let subjectsToDisplay = [];
//         if (currentUser.role === "admin") {
//           const response = await subjectService.getAllSubjects();
//           subjectsToDisplay = response.data.data;
//         } else if (currentUser.role === "teacher") {
//           const response = await userService.getProfile();
//           subjectsToDisplay = response.data.subjectsTaught
//             .map((assignment) => assignment.subject)
//             .filter(Boolean);
//         }
//         setSubjects(subjectsToDisplay);
//       } catch {
//         setError("Failed to load subjects for your role.");
//       } finally {
//         setPageLoading(false);
//       }
//     };
//     loadSubjectsForRole();
//   }, [currentUser.role]);

//   // --- Filter subjects by search text ---
//   const filteredSubjects = useMemo(() => {
//     const query = subjectSearch.trim().toLowerCase();
//     if (!query) return subjects;
//     return subjects.filter((subject) =>
//       `${subject.name} ${subject.gradeLevel}`.toLowerCase().includes(query)
//     );
//   }, [subjects, subjectSearch]);

//   // --- Group filtered subjects by grade level ---
//   const subjectsByGrade = useMemo(() => {
//     const grouped = {};
//     filteredSubjects.forEach((subject) => {
//       const grade = subject.gradeLevel || "Uncategorized";
//       if (!grouped[grade]) grouped[grade] = [];
//       grouped[grade].push(subject);
//     });
//     return grouped;
//   }, [filteredSubjects]);

//   // --- Load assessment types when a subject is selected ---
//   useEffect(() => {
//     if (!selectedSubject) {
//       setAssessmentTypes([]);
//       return;
//     }
//     setAssessmentsLoading(true);
//     setError("");
//     assessmentTypeService
//       .getBySubject(selectedSubject._id)
//       .then((res) => {
//         // Sort by month order
//         const sorted = res.data.data.sort(
//           (a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
//         );
//         setAssessmentTypes(sorted);
//       })
//       .catch(() =>
//         setError("Failed to load assessment types for this subject.")
//       )
//       .finally(() => setAssessmentsLoading(false));
//   }, [selectedSubject]);

//   // --- Filter assessment types based on search ---
//   const filteredAssessmentTypes = assessmentTypes.filter((at) => {
//     const query = search.trim().toLowerCase();
//     if (!query) return true;
//     const text = `${at.name} ${at.month} ${at.totalMarks}`.toLowerCase();
//     return text.includes(query);
//   });

//   // --- Handle New Assessment Create ---
//   const handleCreate = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!newAssessmentSemester) {
//       setError("Please select a semester.");
//       return;
//     }
//     if (!newAssessmentMonth) {
//       setError("Please select a month.");
//       return;
//     }
//     if (!newAssessmentName) {
//       setError("Please select an assessment type.");
//       return;
//     }
//     if (!newAssessmentMarks || newAssessmentMarks < 1) {
//       setError("Please enter valid total marks.");
//       return;
//     }
//     try {
//       const newData = {
//         name: newAssessmentName,
//         totalMarks: Number(newAssessmentMarks),
//         subjectId: selectedSubject._id,
//         gradeLevel: selectedSubject.gradeLevel,
//         month: newAssessmentMonth,
//         semester: newAssessmentSemester,
//       };
//       const response = await assessmentTypeService.create(newData);
//       const updatedList = [...assessmentTypes, response.data.data].sort(
//         (a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
//       );
//       setAssessmentTypes(updatedList);

//       // Reset form inputs
//       setNewAssessmentSemester("");
//       setNewAssessmentMonth("");
//       setNewAssessmentName("");
//       setNewAssessmentMarks("");
//     } catch (err) {
//       setError(
//         err.response?.data?.message || "Failed to create assessment type."
//       );
//     }
//   };

//   // --- Handle Delete ---
//   const handleDelete = async (id) => {
//     if (
//       window.confirm("Are you sure you want to delete this assessment type?")
//     ) {
//       try {
//         await assessmentTypeService.remove(id);
//         setAssessmentTypes((prev) => prev.filter((at) => at._id !== id));
//       } catch {
//         setError(
//           "Failed to delete. This type might be used in existing records."
//         );
//       }
//     }
//   };

//   if (pageLoading) {
//     return <p className="text-center text-lg mt-8">Loading configuration...</p>;
//   }

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold text-gray-800 mb-4">
//         Manage Assessment Types
//       </h2>
//       <p className="text-gray-600 mb-6">
//         Select a subject below to view and manage its grading structure.
//       </p>

//       {!selectedSubject && error && (
//         <p className="text-red-500 mb-4">{error}</p>
//       )}

//       {/* Subject search */}
//       <div className="mb-4">
//         <input
//           type="text"
//           className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
//           placeholder="Search subjects by name or grade"
//           value={subjectSearch}
//           onChange={(e) => setSubjectSearch(e.target.value)}
//         />
//       </div>

//       {/* Subjects grouped by grade */}
//       <div className="space-y-6">
//         {Object.keys(subjectsByGrade).length > 0 ? (
//           Object.keys(subjectsByGrade)
//             .sort()
//             .map((gradeLevel) => (
//               <fieldset
//                 key={gradeLevel}
//                 className="border border-gray-200 p-4 rounded-lg"
//               >
//                 <legend className="font-bold text-lg text-gray-700 px-2">
//                   {gradeLevel}
//                 </legend>
//                 <div className="flex flex-wrap gap-2">
//                   {subjectsByGrade[gradeLevel].map((subject) => (
//                     <button
//                       key={subject._id}
//                       onClick={() => setSelectedSubject(subject)}
//                       className={`px-3 py-1 rounded-md transition-colors duration-200 text-sm font-medium ${
//                         selectedSubject?._id === subject._id
//                           ? "bg-pink-500 text-white shadow"
//                           : "bg-gray-200 hover:bg-gray-300 text-gray-800"
//                       }`}
//                     >
//                       {subject.name}
//                     </button>
//                   ))}
//                 </div>
//               </fieldset>
//             ))
//         ) : (
//           <p>
//             There are no subjects assigned to you. An admin can assign subjects
//             in the 'User Management' page.
//           </p>
//         )}
//       </div>

//       <hr className="my-6 border-t border-gray-200" />

//       {selectedSubject && (
//         <div className="animate-fade-in">
//           <h3 className="text-xl font-bold text-gray-800 mb-4">
//             Assessments for:{" "}
//             <span className="text-pink-600">
//               {selectedSubject.name} ({selectedSubject.gradeLevel})
//             </span>
//           </h3>

//           {/* Assessment search */}
//           <div className="mb-4">
//             <input
//               type="text"
//               placeholder="Search assessments by name, month, or marks"
//               className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {/* Existing Types List */}
//             <div>
//               <h4 className="font-bold text-gray-700 mb-3">Existing Types</h4>
//               {assessmentsLoading ? (
//                 <p>Loading...</p>
//               ) : (
//                 <ul className="space-y-2">
//                   {filteredAssessmentTypes.length > 0 ? (
//                     filteredAssessmentTypes.map((at) => (
//                       <li
//                         key={at._id}
//                         className="flex justify-between items-center bg-gray-50 p-2 rounded"
//                       >
//                         <span>
//                           <strong>{at.month}:</strong> {at.name} (
//                           {at.totalMarks} Marks)
//                         </span>
//                         <button
//                           onClick={() => handleDelete(at._id)}
//                           className="text-red-500 hover:text-red-700 text-sm font-bold"
//                         >
//                           Delete
//                         </button>
//                       </li>
//                     ))
//                   ) : (
//                     <p className="text-gray-500">
//                       No assessment types match your search.
//                     </p>
//                   )}
//                 </ul>
//               )}
//             </div>

//             {/* Add New Assessment Type Form */}
//             <div>
//               <form
//                 onSubmit={handleCreate}
//                 className="bg-gray-50 p-4 rounded-lg border"
//               >
//                 <h4 className="font-bold text-gray-700 mb-3">
//                   Add New Assessment Type
//                 </h4>
//                 <div className="space-y-3">
//                   <select
//                     value={newAssessmentSemester}
//                     onChange={(e) => setNewAssessmentSemester(e.target.value)}
//                     className="shadow-sm border rounded w-full py-2 px-3"
//                     required
//                   >
//                     <option value="" disabled>
//                       -- Select Semester --
//                     </option>
//                     <option value="First Semester">First Semester</option>
//                     <option value="Second Semester">Second Semester</option>
//                   </select>

//                   <select
//                     value={newAssessmentMonth}
//                     onChange={(e) => setNewAssessmentMonth(e.target.value)}
//                     className="shadow-sm border rounded w-full py-2 px-3"
//                     required
//                   >
//                     <option value="" disabled>
//                       -- Select Month --
//                     </option>
//                     {MONTHS.map((m) => (
//                       <option key={m} value={m}>
//                         {m}
//                       </option>
//                     ))}
//                   </select>

//                   <select
//                     value={newAssessmentName}
//                     onChange={(e) => setNewAssessmentName(e.target.value)}
//                     className="shadow-sm border rounded w-full py-2 px-3"
//                     required
//                   >
//                     <option value="" disabled>
//                       -- Select Assessment Type --
//                     </option>
//                     {ASSESSMENT_TYPES.map((type) => (
//                       <option key={type} value={type}>
//                         {type}
//                       </option>
//                     ))}
//                   </select>

//                   <input
//                     type="number"
//                     placeholder="Total Marks"
//                     value={newAssessmentMarks}
//                     onChange={(e) => setNewAssessmentMarks(e.target.value)}
//                     className="shadow-sm border rounded w-full py-2 px-3"
//                     min="1"
//                     required
//                   />

//                   <button
//                     type="submit"
//                     className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
//                   >
//                     + Add
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}

//       {error && selectedSubject && (
//         <p className="text-red-500 text-center mt-4">{error}</p>
//       )}
//     </div>
//   );
// };

// export default AssessmentTypesPage;



// src/pages/AssessmentTypesPage.js
import React, { useState, useEffect, useMemo } from "react";
import subjectService from "../services/subjectService";
import assessmentTypeService from "../services/assessmentTypeService";
import authService from "../services/authService";
import userService from "../services/userService";
import toast from "react-hot-toast";

const MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March",
];

const ASSESSMENT_TYPES = [
  "Periodic Test-I", "Periodic Test-II", "Periodic Test-III", "Periodic Test-IV",
  "SA-I", "SA-II", "Class Test", "NTSE"
];

const AssessmentTypesPage = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  
  // --- Data States ---
  const [allSubjects, setAllSubjects] = useState([]);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  
  // --- Selection States ---
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  
  // --- Form States ---
  const [newAssessmentSemester, setNewAssessmentSemester] = useState("");
  const [newAssessmentName, setNewAssessmentName] = useState("");
  const [newAssessmentMarks, setNewAssessmentMarks] = useState("");
  const [newAssessmentMonth, setNewAssessmentMonth] = useState("");

  // --- UI States ---
  const [pageLoading, setPageLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  // 1. Fetch Subjects based on role
  useEffect(() => {
    const loadSubjectsForRole = async () => {
      try {
        let subjectsToDisplay = [];
        if (currentUser.role === "admin") {
          const response = await subjectService.getAllSubjects();
          subjectsToDisplay = response.data.data;
        } else if (currentUser.role === "teacher") {
          const response = await userService.getProfile();
          subjectsToDisplay = response.data.subjectsTaught
            .map((assignment) => assignment.subject)
            .filter(Boolean);
        }
        setAllSubjects(subjectsToDisplay);
      } catch {
        toast.error("Failed to load subjects.");
      } finally {
        setPageLoading(false);
      }
    };
    loadSubjectsForRole();
  }, [currentUser.role]);

  // 2. Extract Unique Classes
  const availableClasses = useMemo(() => {
    const classes = new Set(allSubjects.map((s) => s.gradeLevel).filter(Boolean));
    return Array.from(classes).sort();
  }, [allSubjects]);

  // 3. Filter Subjects by Selected Class
  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return [];
    return allSubjects.filter((s) => s.gradeLevel === selectedClass);
  }, [allSubjects, selectedClass]);

  // Handle Class Change
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedSubject("");
    setAssessmentTypes([]);
  };

  // Handle Subject Change & Fetch Assessments
  const handleSubjectChange = async (e) => {
    const subId = e.target.value;
    setSelectedSubject(subId);
    setAssessmentTypes([]);

    if (subId) {
      setAssessmentsLoading(true);
      try {
        const res = await assessmentTypeService.getBySubject(subId);
        const sorted = res.data.data.sort(
          (a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
        );
        setAssessmentTypes(sorted);
      } catch {
        toast.error("Failed to load assessment types.");
      } finally {
        setAssessmentsLoading(false);
      }
    }
  };

  // --- Handlers ---
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!newAssessmentSemester || !newAssessmentMonth || !newAssessmentName || !newAssessmentMarks) {
      toast.error("Please fill all required fields.");
      return;
    }

    const currentSubjectObj = allSubjects.find(s => s._id === selectedSubject);

    try {
      const newData = {
        name: newAssessmentName,
        totalMarks: Number(newAssessmentMarks),
        subjectId: selectedSubject,
        gradeLevel: currentSubjectObj.gradeLevel,
        month: newAssessmentMonth,
        semester: newAssessmentSemester,
      };
      
      const response = await assessmentTypeService.create(newData);
      
      const updatedList = [...assessmentTypes, response.data.data].sort(
        (a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
      );
      
      setAssessmentTypes(updatedList);
      toast.success("Assessment added successfully!");

      // Reset form
      setNewAssessmentSemester("");
      setNewAssessmentMonth("");
      setNewAssessmentName("");
      setNewAssessmentMarks("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create assessment.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this assessment type? It might affect existing grades.")) {
      try {
        await assessmentTypeService.remove(id);
        setAssessmentTypes((prev) => prev.filter((at) => at._id !== id));
        toast.success("Deleted successfully!");
      } catch {
        toast.error("Failed to delete. It might be used in records.");
      }
    }
  };

  if (pageLoading) {
    return <div className="flex justify-center items-center mt-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div></div>;
  }

  // Segregate assessments for better view
  const term1Assessments = assessmentTypes.filter(a => a.semester === "First Semester");
  const term2Assessments = assessmentTypes.filter(a => a.semester === "Second Semester");

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Manage Grading Structure</h2>
        <p className="text-sm text-gray-500 mt-1">Configure assessment types and maximum marks for subjects.</p>
      </div>

      {/* STEP 1 & 2: SELECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Select Class</label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all cursor-pointer"
            >
              <option value="">-- Choose Class --</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">2. Select Subject</label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              disabled={!selectedClass}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all cursor-pointer"
            >
              <option value="">-- Choose Subject --</option>
              {filteredSubjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STEP 3: MANAGE ASSESSMENTS (Only visible when subject selected) */}
      {selectedSubject && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* LEFT SIDE: LIST VIEW */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <span>📋</span> Existing Assessments
               </h3>
               
               {assessmentsLoading ? (
                  <p className="text-gray-500 text-sm py-4">Loading structure...</p>
               ) : assessmentTypes.length === 0 ? (
                  <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500">No assessments mapped to this subject yet.</p>
                  </div>
               ) : (
                 <div className="space-y-6">
                    {/* TERM I BOX */}
                    {term1Assessments.length > 0 && (
                      <div className="border border-blue-100 rounded-lg overflow-hidden">
                        <div className="bg-blue-50/50 px-4 py-2 border-b border-blue-100 font-semibold text-blue-800 text-sm">
                          TERM I
                        </div>
                        <ul className="divide-y divide-gray-100">
                          {term1Assessments.map(at => (
                             <li key={at._id} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors">
                               <div>
                                 <span className="font-bold text-gray-800">{at.name}</span>
                                 <div className="text-xs text-gray-500 mt-0.5">Month: {at.month} • Max Marks: {at.totalMarks}</div>
                               </div>
                               <button onClick={() => handleDelete(at._id)} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors">Delete</button>
                             </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* TERM II BOX */}
                    {term2Assessments.length > 0 && (
                      <div className="border border-purple-100 rounded-lg overflow-hidden">
                        <div className="bg-purple-50/50 px-4 py-2 border-b border-purple-100 font-semibold text-purple-800 text-sm">
                          TERM II
                        </div>
                        <ul className="divide-y divide-gray-100">
                          {term2Assessments.map(at => (
                             <li key={at._id} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors">
                               <div>
                                 <span className="font-bold text-gray-800">{at.name}</span>
                                 <div className="text-xs text-gray-500 mt-0.5">Month: {at.month} • Max Marks: {at.totalMarks}</div>
                               </div>
                               <button onClick={() => handleDelete(at._id)} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors">Delete</button>
                             </li>
                          ))}
                        </ul>
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>

          {/* RIGHT SIDE: ADD NEW FORM */}
          <div className="lg:col-span-1">
            <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">+</span>
                Create New
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Semester</label>
                  <select
                    value={newAssessmentSemester}
                    onChange={(e) => setNewAssessmentSemester(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    required
                  >
                    <option value="" disabled>-- Select --</option>
                    <option value="First Semester">First Semester (Term I)</option>
                    <option value="Second Semester">Second Semester (Term II)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Month Conducted</label>
                  <select
                    value={newAssessmentMonth}
                    onChange={(e) => setNewAssessmentMonth(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    required
                  >
                    <option value="" disabled>-- Select --</option>
                    {MONTHS.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Assessment Name</label>
                  <select
                    value={newAssessmentName}
                    onChange={(e) => setNewAssessmentName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    required
                  >
                    <option value="" disabled>-- Select --</option>
                    {ASSESSMENT_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Maximum Marks</label>
                  <input
                    type="number"
                    placeholder="e.g. 20, 80"
                    value={newAssessmentMarks}
                    onChange={(e) => setNewAssessmentMarks(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    min="1"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all mt-2"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};

export default AssessmentTypesPage;
