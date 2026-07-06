// src/pages/ClassManagementPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import classService from "../services/classService";
import subjectService from "../services/subjectService";
import toast from "react-hot-toast";

const ClassManagementPage = () => {
  const [grades, setGrades] = useState([]);
  const [newGradeName, setNewGradeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [expandedGrade, setExpandedGrade] = useState(null);
  const [gradeSubjects, setGradeSubjects] = useState({});
  const [gradeSections, setGradeSections] = useState({});
  const [newSectionName, setNewSectionName] = useState({});
  const [addingSection, setAddingSection] = useState({});

  const loadGrades = async () => {
    try {
      setLoading(true);
      const res = await classService.getAllGrades();
      setGrades(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const loadSubjectsForGrade = async (gradeLevel) => {
    try {
      const res = await subjectService.getAllSubjects(gradeLevel);
      setGradeSubjects((prev) => ({ ...prev, [gradeLevel]: res.data.data || [] }));
    } catch {
      setGradeSubjects((prev) => ({ ...prev, [gradeLevel]: [] }));
    }
  };

  const loadSectionsForGrade = async (gradeLevel) => {
    try {
      const res = await classService.getAllSections(gradeLevel);
      setGradeSections((prev) => ({ ...prev, [gradeLevel]: res.data.data || [] }));
    } catch {
      setGradeSections((prev) => ({ ...prev, [gradeLevel]: [] }));
    }
  };

  const handleAddGrade = async () => {
    const gradeName = newGradeName.trim();
    if (!gradeName) {
      toast.error("Please enter a class/grade name");
      return;
    }

    setAdding(true);
    try {
      const res = await classService.createGrade(gradeName);
      toast.success(res.data.message || `Class "${gradeName}" added!`);
      setNewGradeName("");

      // Auto-create default sections A, B, C for the new grade
      try {
        await classService.createSection(gradeName, "A");
        await classService.createSection(gradeName, "B");
        await classService.createSection(gradeName, "C");
      } catch (e) {
        // Sections may already exist, that's fine
      }

      await loadGrades();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add class");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteGrade = async (gradeLevel) => {
    if (!window.confirm(`Are you sure you want to remove Class "${gradeLevel}"? All its subjects will be deleted too.`)) return;

    try {
      const res = await classService.deleteGrade(gradeLevel);
      toast.success(res.data.message || `Class "${gradeLevel}" removed`);
      await loadGrades();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete class");
    }
  };

  const handleAddSection = async (gradeLevel) => {
    const sectionName = (newSectionName[gradeLevel] || "").trim();
    if (!sectionName) {
      toast.error("Please enter a section name");
      return;
    }

    setAddingSection((prev) => ({ ...prev, [gradeLevel]: true }));
    try {
      const res = await classService.createSection(gradeLevel, sectionName);
      toast.success(res.data.message || `Section "${sectionName}" added!`);
      setNewSectionName((prev) => ({ ...prev, [gradeLevel]: "" }));
      await loadSectionsForGrade(gradeLevel);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add section");
    } finally {
      setAddingSection((prev) => ({ ...prev, [gradeLevel]: false }));
    }
  };

  const handleDeleteSection = async (gradeLevel, sectionId, sectionName) => {
    if (!sectionId) {
      toast.error("This section is from student data only. Remove it by updating student sections.");
      return;
    }
    if (!window.confirm(`Remove section "${sectionName}" from Class ${gradeLevel}?`)) return;

    try {
      const res = await classService.deleteSection(sectionId);
      toast.success(res.data.message || `Section "${sectionName}" removed`);
      await loadSectionsForGrade(gradeLevel);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete section");
    }
  };

  const toggleExpand = (gradeLevel) => {
    if (expandedGrade === gradeLevel) {
      setExpandedGrade(null);
    } else {
      setExpandedGrade(gradeLevel);
      if (!gradeSubjects[gradeLevel]) loadSubjectsForGrade(gradeLevel);
      if (!gradeSections[gradeLevel]) loadSectionsForGrade(gradeLevel);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
            📋
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Class & Section Manager</h2>
            <p className="text-sm text-gray-500 mt-0.5">Create and manage grade levels, sections, and subjects</p>
          </div>
        </div>
      </div>

      {/* Add New Class */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>➕</span> Add New Class / Grade
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newGradeName}
            onChange={(e) => setNewGradeName(e.target.value)}
            placeholder='e.g. "Nursery", "KG", "1", "2", ... "12"'
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleAddGrade()}
          />
          <button
            onClick={handleAddGrade}
            disabled={adding}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-amber-200/50 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {adding ? "Adding..." : "Add Class"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-1">
          Default sections A, B, C will be auto-created for new classes.
        </p>
      </div>

      {/* Existing Classes List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📚</span> Existing Classes
          </h3>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
            {grades.length} Classes
          </span>
        </div>

        {grades.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {grades.map((grade) => (
              <div key={grade} className="transition-colors">
                <div className="flex items-center justify-between p-4 hover:bg-amber-50/30 cursor-pointer" onClick={() => toggleExpand(grade)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold shadow-sm">
                      {String(grade).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">Class {grade}</h4>
                      <p className="text-xs text-gray-400">
                        {gradeSubjects[grade]?.length || 0} subject(s) · {gradeSections[grade]?.length || 0} section(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGrade(grade);
                      }}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete this class"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <span className={`text-gray-400 transition-transform ${expandedGrade === grade ? "rotate-180" : ""}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Expanded details: Sections + Subjects */}
                {expandedGrade === grade && (
                  <div className="px-4 pb-5 pl-16 bg-amber-50/20 animate-fade-in space-y-4">
                    
                    {/* SECTIONS SECTION */}
                    <div className="border-t border-amber-100 pt-3">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sections:</span>
                      </div>

                      {/* Add Section */}
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={newSectionName[grade] || ""}
                          onChange={(e) =>
                            setNewSectionName((prev) => ({ ...prev, [grade]: e.target.value }))
                          }
                          placeholder='e.g. "A", "B", "C"'
                          className="flex-1 max-w-[200px] px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                          onKeyDown={(e) => e.key === "Enter" && handleAddSection(grade)}
                        />
                        <button
                          onClick={() => handleAddSection(grade)}
                          disabled={addingSection[grade]}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50 shadow-sm"
                        >
                          {addingSection[grade] ? "+..." : "+ Add"}
                        </button>
                      </div>

                      {/* Section List */}
                      {gradeSections[grade]?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {gradeSections[grade].map((sec) => (
                            <div
                              key={sec._id || sec.name}
                              className="flex items-center gap-1.5 bg-white border border-amber-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              <span>Section {sec.name}</span>
                              {sec.isManaged !== false ? (
                                <button
                                  onClick={() => handleDeleteSection(grade, sec._id, sec.name)}
                                  className="text-red-400 hover:text-red-600 ml-1 p-0.5 rounded hover:bg-red-50 transition-colors"
                                  title="Delete section"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              ) : (
                                <span className="text-[9px] text-gray-400 ml-1 italic">(student)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No sections defined.</p>
                      )}
                    </div>

                    {/* SUBJECTS SECTION */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subjects:</span>
                        <Link
                          to={`/subjects?grade=${encodeURIComponent(grade)}`}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
                        >
                          Manage Subjects →
                        </Link>
                      </div>
                      {gradeSubjects[grade]?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {gradeSubjects[grade].map((sub) => (
                            <span key={sub._id} className="bg-white border border-amber-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No subjects assigned yet. Add subjects from the Subjects page.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <span className="text-5xl block mb-3 opacity-50">📭</span>
            <p className="font-medium">No classes found. Add your first class above!</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-2xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-bold text-amber-800 text-sm">How Classes, Sections & Subjects Work</h4>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              <strong>Classes</strong> are grade levels (Nursery, KG, 1, 2...). Adding a class auto-creates default sections A, B, C.<br />
              <strong>Sections</strong> are subdivisions within a class (A, B, C...). You can add/remove them freely.<br />
              <strong>Subjects</strong> are managed from the Subjects page. Each subject is assigned to a specific class.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassManagementPage;
