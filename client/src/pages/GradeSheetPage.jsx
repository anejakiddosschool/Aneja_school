

// src/pages/GradeSheetPage.js
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import subjectService from "../services/subjectService";
import assessmentTypeService from "../services/assessmentTypeService";
import gradeService from "../services/gradeService";
import authService from "../services/authService";
import userService from "../services/userService";
import toast from "react-hot-toast";

const GradeSheetPage = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [allSubjects, setAllSubjects] = useState([]);
  
  // --- Selection States ---
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState("");
  
  // // Create dynamic years (Current Year and Next 4)
  // const currentYear = new Date().getFullYear();
  // const yearsList = Array.from({ length: 5 }, (_, i) => `${currentYear - i}-${currentYear - i + 1}`);
  // const [academicYear, setAcademicYear] = useState(yearsList[0]);

    // Fix: Sirf session 2025-2026 hi rakho dropdown me
  const yearsList = ["2025-2026"];
  const [academicYear, setAcademicYear] = useState("2025-2026");


  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [sheetData, setSheetData] = useState(null);
  const [scores, setScores] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Initial Load: Fetch all allowed subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        let subjectsToDisplay = [];
        if (currentUser.role === "admin") {
          const res = await subjectService.getAllSubjects();
          subjectsToDisplay = res.data.data;
        } else {
          const res = await userService.getProfile();
          subjectsToDisplay = res.data.subjectsTaught
            .map((a) => a.subject)
            .filter(Boolean);
        }
        setAllSubjects(subjectsToDisplay);
      } catch (err) {
        toast.error("Failed to load subjects.");
      }
    };
    loadSubjects();
  }, [currentUser.role]);

  // Extract unique classes from allowed subjects
  const availableClasses = useMemo(() => {
    const classes = new Set(allSubjects.map(s => s.gradeLevel).filter(Boolean));
    return Array.from(classes).sort();
  }, [allSubjects]);

  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return [];
    return allSubjects.filter(s => s.gradeLevel === selectedClass);
  }, [allSubjects, selectedClass]);

  // Reset dependent fields when class changes
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedSubject("");
    setSelectedAssessment("");
    setAssessmentTypes([]);
    setSheetData(null);
  };

  // Reset assessments when subject changes and fetch new ones
  const handleSubjectChange = async (e) => {
    const subId = e.target.value;
    setSelectedSubject(subId);
    setSelectedAssessment("");
    setSheetData(null);
    setAssessmentTypes([]);

    if (subId) {
      try {
        const res = await assessmentTypeService.getBySubject(subId);
        setAssessmentTypes(res.data.data);
      } catch (err) {
        toast.error("Failed to load assessments for this subject.");
      }
    }
  };

  const handleAssessmentChange = (e) => {
    setSelectedAssessment(e.target.value);
    setSheetData(null); // Clear table when assessment changes
  };

  const handleYearChange = (e) => {
    setAcademicYear(e.target.value);
    setSheetData(null); // 🌟 FIX: Clear table when Session changes, so user doesn't see old session marks
  };


  const handleLoadSheet = async () => {
    if (!selectedAssessment || !selectedSubject || !academicYear) return;
    setLoading(true);
    setError(null);
    try {
      const response = await gradeService.getGradeSheet(selectedAssessment, academicYear);
      
      setSheetData(response.data);
      
      const initialScores = {};
      response.data.students.forEach((s) => {
        // 🔥 STRICT CHECK: Zero ko preserve karega, null ko "" karega
        initialScores[s._id] = (s.score === 0 || s.score) ? s.score : "";
      });
      setScores(initialScores);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load grade sheet.");
      toast.error("Failed to load grade sheet.");
    } finally {
      setLoading(false);
    }
  };


  const handleScoreChange = (studentId, value) => {
    setScores((prev) => ({ ...prev, [studentId]: value }));
  };

  // const handleSave = async () => {
  //   setLoading(true);
  //   try {
  //     const scoresPayload = Object.keys(scores)
  //       .filter((studentId) => scores[studentId] !== "" && scores[studentId] !== null)
  //       .map((studentId) => ({
  //         studentId,
  //         score: Number(scores[studentId]),
  //       }));

  //     if (scoresPayload.length === 0) {
  //       toast.error("No valid scores to save.");
  //       setLoading(false);
  //       return;
  //     }

  //     await gradeService.saveGradeSheet({
  //       assessmentTypeId: selectedAssessment,
  //       subjectId: selectedSubject,
  //       semester: sheetData.assessmentType.semester,
  //       academicYear: academicYear,
  //       scores: scoresPayload,
  //     });
      
  //     toast.success("Grades saved successfully!");
  //     handleLoadSheet(); // Refresh the grid
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || "Failed to save grades.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };



    const handleSave = async () => {
    setLoading(true);
    try {
      const scoresPayload = Object.keys(scores)
        // FIX: Allow '0' (number or string) but ignore empty string "" or null/undefined
        .filter((studentId) => {
           const val = scores[studentId];
           return val !== "" && val !== null && val !== undefined;
        })
        .map((studentId) => ({
          studentId,
          score: Number(scores[studentId]),
        }));

      // Agar sabne blank chhod diye tabhi payload empty hoga
      if (scoresPayload.length === 0) {
        toast.error("No valid scores to save. Please enter marks for at least one student.");
        setLoading(false);
        return;
      }

      await gradeService.saveGradeSheet({
        assessmentTypeId: selectedAssessment,
        subjectId: selectedSubject,
        semester: sheetData.assessmentType.semester,
        academicYear: academicYear,
        scores: scoresPayload,
      });
      
      toast.success("Grades saved successfully!");
      handleLoadSheet(); // Refresh the grid to show newly saved marks
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save grades.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
      
      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Grade Entry Form</h2>
          <p className="text-sm text-gray-500 mt-1">Select class and subject to enter marks</p>
        </div>
        <Link
          to={"/subject-roster"}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>📋</span> Subject Roster
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Select Class</label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
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
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">-- Choose Subject --</option>
              {filteredSubjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">3. Assessment</label>
            <select
              value={selectedAssessment}
              onChange={handleAssessmentChange}
              disabled={!selectedSubject || assessmentTypes.length === 0}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">-- Choose Assessment --</option>
              {assessmentTypes.map((at) => (
                <option key={at._id} value={at._id}>{at.name} ({at.semester})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
             <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Session</label>
                <select
                  value={academicYear}
                  onChange={handleYearChange} // 🌟 FIX: Use the specific handler to reset table
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  {yearsList.map((year) => (<option key={year} value={year}>{year}</option>))}
                </select>
             </div>
             
             <button
                onClick={handleLoadSheet}
                disabled={!selectedAssessment || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all h-[42px] mt-auto"
              >
                {loading && !sheetData ? "..." : "Load"}
              </button>
          </div>

        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {sheetData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          
          <div className="bg-gray-50 p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Entering Marks for: <span className="text-blue-600">{sheetData.assessmentType.name}</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Session: <span className="text-gray-800 font-bold mr-3">{academicYear}</span>
                Max Marks: <span className="text-gray-800 bg-gray-200 px-2 py-0.5 rounded">{sheetData.assessmentType.totalMarks}</span>
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-all"
            >
              {loading ? "Saving Records..." : "Save All Marks"}
            </button>
          </div>

               <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="py-3 px-6 font-bold w-16 text-center">#</th>
                  <th className="py-3 px-6 font-bold">Student Name</th>
                  <th className="py-3 px-6 font-bold w-48 text-center">Marks Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sheetData.students.length === 0 ? (
                   <tr>
                     <td colSpan="3" className="py-8 text-center text-gray-500">No active students found in this class.</td>
                   </tr>
                ) : (
                  sheetData.students.map((student, index) => (
                    <tr key={student._id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="py-3 px-6 text-center text-gray-400 font-medium">{index + 1}</td>
                      <td className="py-3 px-6 font-medium text-gray-800">{student.fullName}</td>
                      <td className="py-3 px-6">
                        <div className="relative flex justify-center">
                          <input
                            type="number"
                            value={scores[student._id] !== undefined ? scores[student._id] : ""}
                            onChange={(e) => handleScoreChange(student._id, e.target.value)}
                            max={sheetData.assessmentType.totalMarks}
                            min="0"
                            step="any"
                            placeholder="-"
                            className={`w-28 text-center font-bold text-lg p-2 border rounded-lg transition-all focus:outline-none focus:ring-2 
                              ${(scores[student._id] !== "" && scores[student._id] !== undefined && scores[student._id] !== null)
                                  ? "bg-green-50 border-green-200 text-green-700 focus:ring-green-400" 
                                  : "bg-white border-gray-200 text-gray-700 focus:ring-blue-400 focus:border-blue-400"
                              }`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
};

export default GradeSheetPage;
