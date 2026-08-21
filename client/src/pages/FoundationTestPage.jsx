import React, { useState, useEffect, useCallback } from "react";
import foundationTestService from "../services/foundationTestService";
import subjectService from "../services/subjectService";
import userService from "../services/userService";
import authService from "../services/authService";
import toast from "react-hot-toast";

const FoundationTestPage = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const isAdmin = currentUser?.role === "admin";

  // --- View: 'list' | 'detail' ---
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(true);

  // --- List data ---
  const [tests, setTests] = useState([]);

  // --- Detail data ---
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // --- Marks entry ---
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);

  // --- Create form ---
  const [showCreate, setShowCreate] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [form, setForm] = useState({
    name: "",
    gradeLevel: "",
    semester: "First Semester",
    subjects: [],
  });
  const [creating, setCreating] = useState(false);

  // --- Send state ---
  const [sending, setSending] = useState(false);

  // Load list
  const loadTests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await foundationTestService.getFoundationTests();
      setTests(res.data.data || []);
    } catch {
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "list") loadTests();
  }, [view, loadTests]);

  // Load subjects for create form
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        if (isAdmin) {
          const res = await subjectService.getAllSubjects();
          setAllSubjects(res.data.data || []);
        } else {
          const res = await userService.getProfile();
          const subs = res.data?.subjectsTaught?.map((a) => a.subject).filter(Boolean) || [];
          setAllSubjects(subs);
        }
      } catch {}
    };
    loadSubjects();
  }, [isAdmin]);

  // Load detail
  const loadDetail = async (testId) => {
    try {
      setDetailLoading(true);
      setView("detail");
      setSelectedSubjectId(null);
      const res = await foundationTestService.getFoundationTestDetail(testId);
      setDetail(res.data.data);
    } catch {
      toast.error("Failed to load test detail");
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  };

  // Load students for a subject's marks entry
  const loadStudentsForSubject = async (subjectId) => {
    if (!detail) return;
    try {
      setSelectedSubjectId(subjectId);
      const res = await foundationTestService.getFoundationTestStudents(detail._id, { subjectId });
      setStudents(res.data.data || []);
      const initial = {};
      (res.data.data || []).forEach((s) => {
        initial[s._id] = s.score !== null && s.score !== undefined ? String(s.score) : "";
      });
      setScores(initial);
    } catch {
      toast.error("Failed to load students");
    }
  };

  // Save marks
  const handleSaveMarks = async () => {
    if (!detail || !selectedSubjectId) return;
    try {
      setSaving(true);
      const scoreArray = Object.entries(scores).map(([studentId, score]) => ({
        studentId,
        score: score === "" ? null : Number(score),
      }));
      await foundationTestService.saveFoundationTestMarks(detail._id, selectedSubjectId, scoreArray);
      toast.success("Marks saved!");
      // Reload detail
      const res = await foundationTestService.getFoundationTestDetail(detail._id);
      setDetail(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  // Create test
  const handleCreate = async () => {
    if (!form.name || !form.gradeLevel || form.subjects.length < 2) {
      return toast.error("Name, class, and at least 2 subjects required!");
    }
    try {
      setCreating(true);
      await foundationTestService.createFoundationTest(form);
      toast.success("Foundation Test created!");
      setShowCreate(false);
      setForm({ name: "", gradeLevel: "", semester: "First Semester", subjects: [] });
      loadTests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  // Delete test
  const handleDelete = async (testId) => {
    if (!window.confirm("Delete this foundation test?")) return;
    try {
      await foundationTestService.deleteFoundationTest(testId);
      toast.success("Deleted!");
      loadTests();
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Send merged PDFs
  const handleSend = async (studentIds = null) => {
    if (!detail) return;
    try {
      setSending(true);
      const res = await foundationTestService.sendMergedPdf(detail._id, studentIds);
      toast.success(res.data.message || "Sent!");
      const refresh = await foundationTestService.getFoundationTestDetail(detail._id);
      setDetail(refresh.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  // Preview PDF (fetch as blob and open in new tab)
  const [previewing, setPreviewing] = useState(null);
  const handlePreview = async (studentId) => {
    if (!detail) return;
    try {
      setPreviewing(studentId || 'all');
      await foundationTestService.previewMergedPdf(detail._id, studentId);
    } catch {
      toast.error("Failed to load preview");
    } finally {
      setPreviewing(null);
    }
  };

  // Download PDF
  const handleDownload = async (studentId) => {
    if (!detail) return;
    try {
      const res = await foundationTestService.downloadMergedPdf(detail._id, studentId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Foundation_${detail.name}_${studentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download");
    }
  };

  // Unique classes from subjects
  const classes = [...new Set(allSubjects.map((s) => s.gradeLevel).filter(Boolean))].sort();

  // Subjects for selected class
  const classSubjects = allSubjects.filter((s) => !form.gradeLevel || s.gradeLevel === form.gradeLevel);

  // Toggle subject in create form
  const toggleSubject = (subjectId) => {
    setForm((prev) => {
      const exists = prev.subjects.find((s) => s.subjectId === subjectId);
      if (exists) {
        return { ...prev, subjects: prev.subjects.filter((s) => s.subjectId !== subjectId) };
      }
      return { ...prev, subjects: [...prev.subjects, { subjectId, marks: 20 }] };
    });
  };

  const updateSubjectMarks = (subjectId, marks) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.subjectId === subjectId ? { ...s, marks: Number(marks) || 0 } : s)),
    }));
  };

  const totalMarks = form.subjects.reduce((sum, s) => sum + (s.marks || 0), 0);

  // Get teacher's subject IDs
  const [mySubjectIds, setMySubjectIds] = useState([]);
  useEffect(() => {
    if (!isAdmin) {
      const ids = allSubjects.map((s) => String(s._id));
      setMySubjectIds(ids);
    }
  }, [allSubjects, isAdmin]);

  const canEditSubject = (subjectId) => {
    if (isAdmin) return true;
    if (mySubjectIds.length === 0) return true;
    return mySubjectIds.includes(String(subjectId));
  };

  // ===================== RENDER =====================

  // --- LIST VIEW ---
  if (view === "list") {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">🏛️ Foundation Tests</h1>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              {showCreate ? "✕ Cancel" : "+ New Foundation Test"}
            </button>
          )}
        </div>

        {/* Create Form */}
        {showCreate && isAdmin && (
          <div className="bg-white rounded-2xl border-2 border-pink-200 p-6 mb-6 shadow-md">
            <h3 className="font-extrabold text-lg mb-4">Create Foundation Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Test Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300 outline-none"
                  placeholder="e.g. Foundation Test - Unit 1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Class</label>
                <select
                  value={form.gradeLevel}
                  onChange={(e) => setForm({ ...form, gradeLevel: e.target.value, subjects: [] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300 outline-none"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300 outline-none"
                >
                  <option>First Semester</option>
                  <option>Second Semester</option>
                </select>
              </div>
            </div>

            {form.gradeLevel && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-2">Select Subjects (min 2) — Marks per subject:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {classSubjects.map((sub) => {
                    const selected = form.subjects.find((s) => s.subjectId === sub._id);
                    return (
                      <div
                        key={sub._id}
                        className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                          selected ? "border-pink-400 bg-pink-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() => toggleSubject(sub._id)}
                      >
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleSubject(sub._id)}
                          className="accent-pink-600"
                        />
                        <span className="text-sm font-medium flex-1">{sub.name}</span>
                        {selected && (
                          <input
                            type="number"
                            value={selected.marks}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateSubjectMarks(sub._id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center"
                            min="1"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {form.subjects.length > 0 && (
              <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3 mb-4">
                <span className="text-sm font-bold text-blue-800">{form.subjects.length} subjects selected</span>
                <span className="text-lg font-extrabold text-blue-900">Total: {totalMarks} marks</span>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={creating || !form.name || !form.gradeLevel || form.subjects.length < 2}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white font-bold px-6 py-2.5 rounded-xl transition-all"
            >
              {creating ? "Creating..." : "Create Foundation Test"}
            </button>
          </div>
        )}

        {/* Tests List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 font-medium">No Foundation Tests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
                onClick={() => loadDetail(t._id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-gray-900">{t.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Class: {t.gradeLevel} • Total: {t.totalMarks} marks • {t.completedSubjects || 0}/{t.totalSubjects || t.subjects?.length || 0} subjects filled
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {t.subjects?.map((s) => (
                        <span key={s._id || s.subject?._id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {s.subject?.name || "Subject"} ({s.marks})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full ${
                        t.status === "complete"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {t.status === "complete" ? "✅ Ready" : "⏳ Pending"}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(t._id);
                        }}
                        className="text-red-400 hover:text-red-600 text-lg px-2"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (detailLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading...</p>
      </div>
    );
  }

  if (!detail) return null;

  const allDone = detail.status === "complete";

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Back + Title */}
      <button onClick={() => setView("list")} className="text-pink-600 font-bold text-sm mb-4 hover:underline">
        ← Back to List
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{detail.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Class: {detail.gradeLevel} • Total: {detail.totalMarks} marks • {detail.completedSubjects}/{detail.totalSubjects} subjects filled
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePreview()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
          >
            👁️ Preview PDF
          </button>
          {allDone && (
            <button
              onClick={() => handleSend()}
              disabled={sending}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
            >
              {sending ? "Sending..." : "📤 Send to All"}
            </button>
          )}
          {!allDone && isAdmin && (
            <span className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-xl font-medium">
              ⚠️ All subjects must have marks to send
            </span>
          )}
        </div>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {detail.subjectStatus?.map((sub) => {
          const isSelected = selectedSubjectId === sub.subjectId;
          const canEdit = canEditSubject(sub.subjectId);
          return (
            <div
              key={sub.subjectId}
              onClick={() => canEdit && loadStudentsForSubject(sub.subjectId)}
              className={`rounded-2xl border-2 p-4 transition-all ${
                canEdit
                  ? `cursor-pointer ${isSelected ? "border-pink-500 bg-pink-50 shadow-md" : "border-gray-100 bg-white hover:border-pink-200"}`
                  : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{sub.subjectName}</h4>
                  <p className="text-xs text-gray-400">Max: {sub.totalMarks} marks</p>
                </div>
                <div>
                  {sub.hasMarks ? (
                    <span className="text-green-600 font-bold text-sm">✅ Done</span>
                  ) : canEdit ? (
                    <span className="text-yellow-600 font-bold text-sm">⏳ Pending</span>
                  ) : (
                    <span className="text-gray-400 font-bold text-sm">⏳ Pending</span>
                  )}
                </div>
              </div>
              {canEdit && !sub.hasMarks && isSelected && (
                <p className="text-xs text-pink-600 mt-2 font-medium">📝 Enter marks below</p>
              )}
              {!canEdit && (
                <p className="text-xs text-gray-400 mt-2">🔒 Not your subject</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Marks Entry Table */}
      {selectedSubjectId && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-lg">
              📝 {detail.subjectStatus?.find((s) => s.subjectId === selectedSubjectId)?.subjectName} — Enter Marks
            </h3>
            <button
              onClick={handleSaveMarks}
              disabled={saving}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all"
            >
              {saving ? "Saving..." : "💾 Save Marks"}
            </button>
          </div>

          {students.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No students found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-bold text-gray-600">#</th>
                    <th className="text-left py-2 px-3 font-bold text-gray-600">Name</th>
                    <th className="text-left py-2 px-3 font-bold text-gray-600">Roll</th>
                    <th className="text-right py-2 px-3 font-bold text-gray-600">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                      <td className="py-2 px-3 font-medium">{s.fullName}</td>
                      <td className="py-2 px-3 text-gray-500">{s.rollNumber || "-"}</td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          value={scores[s._id] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const maxMarks = detail.subjectStatus?.find((s) => s.subjectId === selectedSubjectId)?.totalMarks || 999;
                            if (val === "") {
                              setScores({ ...scores, [s._id]: "" });
                            } else {
                              const num = Number(val);
                              if (num > maxMarks) {
                                toast.error(`Max marks is ${maxMarks}!`);
                                setScores({ ...scores, [s._id]: String(maxMarks) });
                              } else if (num < 0) {
                                setScores({ ...scores, [s._id]: "0" });
                              } else {
                                setScores({ ...scores, [s._id]: val });
                              }
                            }
                          }}
                          className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center text-sm focus:ring-2 focus:ring-pink-300 outline-none"
                          min="0"
                          max={detail.subjectStatus?.find((s) => s.subjectId === selectedSubjectId)?.totalMarks}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Merged Overview */}
      {!selectedSubjectId && detail.students && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-extrabold text-lg mb-4">👥 All Students — Merged Overview</h3>
          <p className="text-sm text-gray-400 mb-4">Click a subject card above to enter marks for that subject.</p>
          {detail.students.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No students in this class</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-bold text-gray-600">#</th>
                    <th className="text-left py-2 px-3 font-bold text-gray-600">Name</th>
                    <th className="text-left py-2 px-3 font-bold text-gray-600">Roll</th>
                    {detail.subjectStatus?.map((sub) => (
                      <th key={sub.subjectId} className="text-center py-2 px-2 font-bold text-gray-600 text-xs">
                        {sub.subjectName}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 font-bold text-gray-800">Total</th>
                    <th className="text-center py-2 px-3 font-bold text-gray-600">%</th>
                    <th className="text-center py-2 px-3 font-bold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.students.map((st, i) => {
                    const total = st.totalScored || 0;
                    const pct = detail.totalMarks > 0 ? ((total / detail.totalMarks) * 100).toFixed(1) : 0;
                    return (
                      <tr key={st._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                        <td className="py-2 px-3 font-medium">{st.fullName}</td>
                        <td className="py-2 px-3 text-gray-500">{st.rollNumber || "-"}</td>
                        {detail.subjectStatus?.map((sub) => {
                          const val = st.subScores?.[sub.subjectId];
                          return (
                            <td key={sub.subjectId} className="text-center py-2 px-2">
                              {val !== null && val !== undefined ? (
                                <span className={`font-medium ${val >= sub.totalMarks * 0.5 ? "text-green-700" : "text-red-600"}`}>
                                  {val}/{sub.totalMarks}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center py-2 px-3 font-extrabold">{total}/{detail.totalMarks}</td>
                        <td className="text-center py-2 px-3">
                          <span
                            className={`font-bold ${
                              pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                            <td className="text-center py-2 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handlePreview(st._id)}
                                disabled={previewing === st._id}
                                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs font-bold px-2 py-1 rounded-lg transition-all"
                                title="View PDF"
                              >
                                {previewing === st._id ? "⏳" : "👁️"}
                              </button>
                              <button
                                onClick={() => handleDownload(st._id)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-2 py-1 rounded-lg transition-all"
                                title="Download PDF"
                              >
                                📥
                              </button>
                              {allDone && (
                                <button
                                  onClick={() => handleSend([st._id])}
                                  disabled={sending}
                                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-xs font-bold px-2 py-1 rounded-lg transition-all"
                                  title="Send to parent"
                                >
                                  📤
                                </button>
                              )}
                            </div>
                          </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action buttons at bottom */}
          {allDone && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handlePreview()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all"
              >
                👁️ Preview PDF
              </button>
              <button
                onClick={() => handleSend()}
                disabled={sending}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-6 py-2.5 rounded-xl transition-all"
              >
                {sending ? "Sending..." : "📤 Send Merged PDF to All"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FoundationTestPage;
