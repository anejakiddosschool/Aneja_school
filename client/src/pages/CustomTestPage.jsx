// src/pages/CustomTestPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import subjectService from "../services/subjectService";
import customTestService from "../services/customTestService";
import authService from "../services/authService";
import userService from "../services/userService";
import toast from "react-hot-toast";

const CustomTestPage = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [allSubjects, setAllSubjects] = useState([]);

  // --- View State: 'list' | 'create' | 'marks' ---
  const [view, setView] = useState("list");

  // --- Selection for list view ---
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // --- Test data ---
  const [customTests, setCustomTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);

  // --- Create form ---
  const [newTestName, setNewTestName] = useState("");
  const [newTestClass, setNewTestClass] = useState("");
  const [newTestSubject, setNewTestSubject] = useState("");
  const [newTestMarks, setNewTestMarks] = useState("");
  const [newTestSemester, setNewTestSemester] = useState("First Semester");

  // --- Marks entry ---
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [isSending, setIsSending] = useState(false);
  
  // --- Checkbox selection ---
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);

  // Load subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        let subjectsToDisplay = [];
        if (currentUser.role === "admin") {
          // Admin: full access to ALL subjects
          const res = await subjectService.getAllSubjects();
          subjectsToDisplay = res.data.data;
        } else {
          const res = await userService.getProfile();
          // Homeroom teacher: only subjects from their own class
          if (res.data.homeroomGrade) {
            const allSubs = await subjectService.getAllSubjects();
            subjectsToDisplay = allSubs.data.data.filter(s => s.gradeLevel === res.data.homeroomGrade);
          } else {
            // Regular teacher: only assigned subjects
            subjectsToDisplay = res.data.subjectsTaught
              .map((a) => a.subject)
              .filter(Boolean);
          }
        }
        setAllSubjects(subjectsToDisplay);
      } catch {
        toast.error("Failed to load subjects.");
      } finally {
        setPageLoading(false);
      }
    };
    loadSubjects();
  }, [currentUser.role]);

  // Unique classes (used in list view)
  const availableClasses = useMemo(() => {
    const classes = new Set(allSubjects.map((s) => s.gradeLevel).filter(Boolean));
    return Array.from(classes).sort();
  }, [allSubjects]);

  // Subjects filtered by selectedClass (used in list view)
  const filteredSubjects = useMemo(() => {
    if (!selectedClass) return [];
    return allSubjects.filter((s) => s.gradeLevel === selectedClass);
  }, [allSubjects, selectedClass]);

  // Subjects filtered by newTestClass (used in create view - must be top-level for hooks rules)
  const createSubjects = useMemo(() => {
    if (!newTestClass) return [];
    return allSubjects.filter((s) => s.gradeLevel === newTestClass);
  }, [allSubjects, newTestClass]);

  // Fetch tests
  const fetchTests = useCallback(async () => {
    try {
      const params = {};
      if (selectedSubject) params.subjectId = selectedSubject;
      if (selectedClass) params.gradeLevel = selectedClass;
      const res = await customTestService.getCustomTests(params);
      setCustomTests(res.data.data || []);
    } catch {
      toast.error("Failed to load custom tests.");
    }
  }, [selectedSubject, selectedClass]);

  useEffect(() => {
    if (view === "list") fetchTests();
  }, [view, fetchTests]);

  // Load students for marks entry
  const loadStudentsForTest = async (test) => {
    try {
      const res = await customTestService.getTestStudents(test._id);
      setSelectedTest(res.data.test);
      setStudents(res.data.data || []);

      const initialScores = {};
      (res.data.data || []).forEach((s) => {
        initialScores[s._id] = s.score !== null && s.score !== undefined ? s.score : "";
      });
      setScores(initialScores);
      setSelectedStudents(new Set());
      setSelectAll(false);
      setView("marks");
    } catch {
      toast.error("Failed to load students.");
    }
  };

  // Handle create test
  const handleCreateTest = async (e) => {
    e.preventDefault();

    if (!newTestName.trim()) { toast.error("Please enter a test name."); return; }
    if (!newTestClass) { toast.error("Please select a class."); return; }
    if (!newTestSubject) { toast.error("Please select a subject."); return; }
    if (!newTestMarks || newTestMarks < 1) { toast.error("Please enter valid total marks."); return; }

    try {
      await customTestService.createCustomTest({
        name: newTestName.trim(),
        subjectId: newTestSubject,
        gradeLevel: newTestClass,
        totalMarks: Number(newTestMarks),
        semester: newTestSemester,
      });

      toast.success(`Custom test "${newTestName}" created!`);
      setNewTestName("");
      setNewTestMarks("");
      fetchTests();
      setView("list");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create test.");
    }
  };

  // Handle save marks
  const handleSaveMarks = async () => {
    if (!selectedTest) return;

    const scoresPayload = Object.keys(scores)
      .filter((id) => scores[id] !== "" && scores[id] !== null && scores[id] !== undefined)
      .map((id) => ({ studentId: id, score: Number(scores[id]) }));

    if (scoresPayload.length === 0) {
      toast.error("Please enter marks for at least one student.");
      return;
    }

    try {
      await customTestService.saveTestMarks(selectedTest._id, scoresPayload);
      toast.success("Marks saved successfully!");
      loadStudentsForTest(selectedTest);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save marks.");
    }
  };

  // Handle send to all parents
  const handleSendAll = async () => {
    if (!selectedTest) return;
    if (!window.confirm(`Send PDFs to ALL parents? (${students.filter(s => s.score !== null).length} students)`)) return;

    setIsSending(true);
    try {
      const res = await customTestService.sendPdfToAllParents(selectedTest._id);
      toast.success(res.data.message || "PDFs sent successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send PDFs.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle send to selected parents
  const handleSendSelected = async () => {
    if (!selectedTest) return;
    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student.");
      return;
    }
    if (!window.confirm(`Send PDFs to ${selectedStudents.size} selected parents?`)) return;

    setIsSending(true);
    try {
      const res = await customTestService.sendPdfToSelectedParents(
        selectedTest._id, 
        Array.from(selectedStudents)
      );
      toast.success(res.data.message || "PDFs sent successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send PDFs.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle send to single parent
  const handleSendSingle = async (studentId, studentName) => {
    if (!selectedTest) return;
    if (!window.confirm(`Send PDF to parent of ${studentName}?`)) return;
    try {
      await customTestService.sendPdfToParent(selectedTest._id, studentId);
      toast.success(`PDF sent to parent of ${studentName}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send.");
    }
  };

  // Handle delete
  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Delete this test and all associated grades?")) return;
    try {
      await customTestService.deleteCustomTest(testId);
      toast.success("Test deleted.");
      fetchTests();
    } catch {
      toast.error("Failed to delete test.");
    }
  };

  // Handle marks change
  const handleScoreChange = (studentId, value) => {
    setScores((prev) => ({ ...prev, [studentId]: value }));
  };

  // Toggle student selection
  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      setSelectAll(next.size === students.length);
      return next;
    });
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents(new Set());
      setSelectAll(false);
    } else {
      setSelectedStudents(new Set(students.map((s) => s._id)));
      setSelectAll(true);
    }
  };

  const handleDownloadPdf = async (studentId, studentName) => {
    if (!selectedTest) return;
    try {
      const res = await customTestService.generateStudentPdf(selectedTest._id, studentId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedTest.name}_${studentName}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded.");
    } catch {
      toast.error("Failed to generate PDF.");
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center mt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // ============ LIST VIEW ============
  if (view === "list") {
    const sortedTests = [...customTests].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>📝</span> Custom Tests
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Create flexible tests with any name, subject, and marks. Auto-deletes after 15 days.
            </p>
          </div>
          <button
            onClick={() => {
              // Carry over filter selections to create form (no double entry!)
              if (selectedClass) setNewTestClass(selectedClass);
              if (selectedSubject) setNewTestSubject(selectedSubject);
              setView("create");
            }}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <span>+</span> New Custom Test
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Filter by Class</label>
              <select
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject(""); }}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer"
              >
                <option value="">-- All Classes --</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Filter by Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedClass}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50 focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer"
              >
                <option value="">-- All Subjects --</option>
                {filteredSubjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {sortedTests.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="text-5xl mb-4">🧪</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No Custom Tests Yet</h3>
              <p className="text-gray-500 text-sm mb-6">
                Create your first custom test — give it any name, set marks, and share results via WhatsApp.
              </p>
              <button onClick={() => {
                if (selectedClass) setNewTestClass(selectedClass);
                if (selectedSubject) setNewTestSubject(selectedSubject);
                setView("create");
              }} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 px-6 rounded-lg transition-all">
                + Create Custom Test
              </button>
            </div>
          ) : (
            sortedTests.map((test) => {
              const isExpired = test.expiresAt && new Date(test.expiresAt) < new Date();
              const daysLeft = test.expiresAt
                ? Math.ceil((new Date(test.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
                : 15;

              return (
                <div key={test._id} className={`bg-white p-5 rounded-xl shadow-sm border transition-all hover:shadow-md ${isExpired ? "border-red-200 opacity-60" : "border-gray-100"}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-lg">{test.name}</h3>
                        <span className="bg-pink-50 text-pink-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-pink-100">{test.subject?.name || "N/A"}</span>
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded-full">{test.gradeLevel}</span>
                        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-0.5 rounded-full">{test.totalMarks} Marks</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>📅 {new Date(test.createdAt).toLocaleDateString()}</span>
                        {test.expiresAt && (
                          <span className={daysLeft <= 3 ? "text-red-500 font-bold" : "text-gray-400"}>
                            {isExpired ? "🗑️ Expired" : `⏳ ${daysLeft} days left`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => loadStudentsForTest(test)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2 px-4 rounded-lg text-sm transition-all">Enter Marks</button>
                      <button onClick={() => handleDeleteTest(test._id)} className="bg-red-50 hover:bg-red-100 text-red-500 font-semibold py-2 px-4 rounded-lg text-sm transition-all">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ============ CREATE VIEW ============
  if (view === "create") {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in pb-10">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Create Custom Test</h2>
              <p className="text-sm text-gray-500 mt-1">Fully flexible — choose any name, any subject, any marks.</p>
            </div>
            <button onClick={() => setView("list")} className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold py-2 px-4 rounded-lg text-sm transition-all">← Back</button>
          </div>

          <form onSubmit={handleCreateTest} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Test Name <span className="text-red-400">*</span></label>
              <input type="text" value={newTestName} onChange={(e) => setNewTestName(e.target.value)}
                placeholder='e.g. "Surprise Test", "Weekly Quiz", "Unit Test-1"...'
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all" required />
              <p className="text-xs text-gray-400 mt-1">You can name it anything you want — completely custom!</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Class <span className="text-red-400">*</span></label>
              <select value={newTestClass} onChange={(e) => { setNewTestClass(e.target.value); setNewTestSubject(""); }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" required>
                <option value="">-- Select Class --</option>
                {availableClasses.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Subject <span className="text-red-400">*</span></label>
              <select value={newTestSubject} onChange={(e) => setNewTestSubject(e.target.value)} disabled={!newTestClass}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-50 focus:ring-2 focus:ring-pink-500 outline-none" required>
                <option value="">-- Select Subject --</option>
                {createSubjects.map((s) => (<option key={s._id} value={s._id}>{s.name}</option>))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Total Marks <span className="text-red-400">*</span></label>
                <input type="number" value={newTestMarks} onChange={(e) => setNewTestMarks(e.target.value)}
                  placeholder="e.g. 20, 50, 100" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" min="1" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Semester</label>
                <select value={newTestSemester} onChange={(e) => setNewTestSemester(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none">
                  <option value="First Semester">Term I</option>
                  <option value="Second Semester">Term II</option>
                </select>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-amber-600 text-lg">ℹ️</span>
                <div>
                  <p className="font-semibold text-amber-800">Auto-delete after 15 days</p>
                  <p className="text-amber-600 text-xs mt-1">This test will be automatically deleted from the database after 15 days. Make sure to share results with parents before that.</p>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-all text-base">Create Custom Test</button>
          </form>
        </div>
      </div>
    );
  }

  // ============ MARKS ENTRY VIEW ============
  if (view === "marks" && selectedTest) {
    const studentsWithScores = students;
    const hasMarks = studentsWithScores.some((s) => s.score !== null && s.score !== undefined);

    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
        {/* Header with action buttons */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setView("list")} className="text-gray-400 hover:text-gray-600 transition-colors">←</button>
                <h2 className="text-xl font-bold text-gray-800">{selectedTest.name}</h2>
                <span className="bg-pink-50 text-pink-600 text-xs font-bold px-2.5 py-0.5 rounded-full">Max: {selectedTest.totalMarks}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-7">
                {studentsWithScores.length} students • Auto-deletes on{" "}
                {selectedTest.expiresAt ? new Date(selectedTest.expiresAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleSaveMarks} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all text-sm">
                💾 Save Marks
              </button>
              <button
                onClick={handleSendSelected}
                disabled={selectedStudents.size === 0 || isSending}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all text-sm flex items-center gap-1.5"
              >
                {isSending ? (
                  <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>Sending...</>
                ) : (
                  <>📤 Send Selected ({selectedStudents.size})</>
                )}
              </button>
              <button
                onClick={handleSendAll}
                disabled={!hasMarks || isSending}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all text-sm flex items-center gap-1.5"
              >
                {isSending ? (
                  <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>Sending...</>
                ) : (
                  <>📤 Send to All Parents</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-bold w-10 text-center">#</th>
                  <th className="py-3.5 px-4 font-bold">Student Name</th>
                  <th className="py-3.5 px-4 font-bold w-24 text-center">Roll No</th>
                  <th className="py-3.5 px-4 font-bold w-40 text-center">Marks ({selectedTest.totalMarks})</th>
                  <th className="py-3.5 px-4 font-bold w-52 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentsWithScores.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-gray-400">No active students found in this class.</td>
                  </tr>
                ) : (
                  studentsWithScores.map((student, idx) => {
                    const hasScore = scores[student._id] !== "" && scores[student._id] !== null && scores[student._id] !== undefined;
                    const isChecked = selectedStudents.has(student._id);

                    return (
                      <tr key={student._id} className={`hover:bg-gray-50/50 transition-colors ${isChecked ? "bg-indigo-50/30" : ""}`}>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudent(student._id)}
                            className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 text-center text-gray-400 text-sm">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800">{student.fullName}</div>
                          <div className="text-xs text-gray-400">{student.studentId}</div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 text-sm">{student.rollNumber || "-"}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              value={scores[student._id] !== undefined ? scores[student._id] : ""}
                              onChange={(e) => handleScoreChange(student._id, e.target.value)}
                              max={selectedTest.totalMarks}
                              min="0"
                              step="any"
                              placeholder="-"
                              className={`w-28 text-center font-bold text-lg p-2 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
                                hasScore
                                  ? "bg-green-50 border-green-200 text-green-700 focus:ring-green-400"
                                  : "bg-white border-gray-200 text-gray-700 focus:ring-blue-400"
                              }`}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handleDownloadPdf(student._id, student.fullName)}
                              disabled={!hasScore}
                              className="bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 font-medium py-1.5 px-3 rounded-lg text-xs transition-all"
                            >📄 PDF</button>
                            <button
                              onClick={() => handleSendSingle(student._id, student.fullName)}
                              disabled={!hasScore}
                              className="bg-blue-50 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed text-blue-600 font-medium py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1"
                            >📤 Send</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CustomTestPage;
