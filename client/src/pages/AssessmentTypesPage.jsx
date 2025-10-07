import React, { useState, useEffect, useMemo } from "react";
import subjectService from "../services/subjectService";
import assessmentTypeService from "../services/assessmentTypeService";
import authService from "../services/authService";
import userService from "../services/userService";

// Define months array for sorting and dropdown
const MONTHS = [
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
];

const AssessmentTypesPage = () => {
  // --- State Management ---
  const [currentUser] = useState(authService.getCurrentUser());
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [newAssessmentSemester, setNewAssessmentSemester] = useState("");
  const [newAssessmentName, setNewAssessmentName] = useState("");
  const [newAssessmentMarks, setNewAssessmentMarks] = useState("");
  const [newAssessmentMonth, setNewAssessmentMonth] = useState("");

  const ASSESSMENT_TYPES = [
    "Periodic Test-I",
    "Periodic Test-II",
    "SA-I",
    "SA-II",
    "Class Test",
  ];

  // UI feedback + loading states
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  // Search states
  const [subjectSearch, setSubjectSearch] = useState("");
  const [search, setSearch] = useState(""); // For assessment type search

  // --- Load subjects per user role ---
  useEffect(() => {
    const loadSubjectsForRole = async () => {
      setError("");
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
        setSubjects(subjectsToDisplay);
      } catch {
        setError("Failed to load subjects for your role.");
      } finally {
        setPageLoading(false);
      }
    };
    loadSubjectsForRole();
  }, [currentUser.role]);

  // --- Filter subjects by search text ---
  const filteredSubjects = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((subject) =>
      `${subject.name} ${subject.gradeLevel}`.toLowerCase().includes(query)
    );
  }, [subjects, subjectSearch]);

  // --- Group filtered subjects by grade level ---
  const subjectsByGrade = useMemo(() => {
    const grouped = {};
    filteredSubjects.forEach((subject) => {
      const grade = subject.gradeLevel || "Uncategorized";
      if (!grouped[grade]) grouped[grade] = [];
      grouped[grade].push(subject);
    });
    return grouped;
  }, [filteredSubjects]);

  // --- Load assessment types when a subject is selected ---
  useEffect(() => {
    if (!selectedSubject) {
      setAssessmentTypes([]);
      return;
    }
    setAssessmentsLoading(true);
    setError("");
    assessmentTypeService
      .getBySubject(selectedSubject._id)
      .then((res) => {
        // Sort by month order
        const sorted = res.data.data.sort(
          (a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
        );
        setAssessmentTypes(sorted);
      })
      .catch(() =>
        setError("Failed to load assessment types for this subject.")
      )
      .finally(() => setAssessmentsLoading(false));
  }, [selectedSubject]);

  // --- Filter assessment types based on search ---
  const filteredAssessmentTypes = assessmentTypes.filter((at) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const text = `${at.name} ${at.month} ${at.totalMarks}`.toLowerCase();
    return text.includes(query);
  });

  // --- Handle New Assessment Create ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!newAssessmentSemester) {
      setError("Please select a semester.");
      return;
    }
    if (!newAssessmentMonth) {
      setError("Please select a month.");
      return;
    }
    if (!newAssessmentName) {
      setError("Please select an assessment type.");
      return;
    }
    if (!newAssessmentMarks || newAssessmentMarks < 1) {
      setError("Please enter valid total marks.");
      return;
    }
    try {
      const newData = {
        name: newAssessmentName,
        totalMarks: Number(newAssessmentMarks),
        subjectId: selectedSubject._id,
        gradeLevel: selectedSubject.gradeLevel,
        month: newAssessmentMonth,
        semester: newAssessmentSemester,
      };
      const response = await assessmentTypeService.create(newData);
      const updatedList = [...assessmentTypes, response.data.data].sort(
        (a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
      );
      setAssessmentTypes(updatedList);

      // Reset form inputs
      setNewAssessmentSemester("");
      setNewAssessmentMonth("");
      setNewAssessmentName("");
      setNewAssessmentMarks("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create assessment type."
      );
    }
  };

  // --- Handle Delete ---
  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this assessment type?")
    ) {
      try {
        await assessmentTypeService.remove(id);
        setAssessmentTypes((prev) => prev.filter((at) => at._id !== id));
      } catch {
        setError(
          "Failed to delete. This type might be used in existing records."
        );
      }
    }
  };

  if (pageLoading) {
    return <p className="text-center text-lg mt-8">Loading configuration...</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Manage Assessment Types
      </h2>
      <p className="text-gray-600 mb-6">
        Select a subject below to view and manage its grading structure.
      </p>

      {!selectedSubject && error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {/* Subject search */}
      <div className="mb-4">
        <input
          type="text"
          className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Search subjects by name or grade"
          value={subjectSearch}
          onChange={(e) => setSubjectSearch(e.target.value)}
        />
      </div>

      {/* Subjects grouped by grade */}
      <div className="space-y-6">
        {Object.keys(subjectsByGrade).length > 0 ? (
          Object.keys(subjectsByGrade)
            .sort()
            .map((gradeLevel) => (
              <fieldset
                key={gradeLevel}
                className="border border-gray-200 p-4 rounded-lg"
              >
                <legend className="font-bold text-lg text-gray-700 px-2">
                  {gradeLevel}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {subjectsByGrade[gradeLevel].map((subject) => (
                    <button
                      key={subject._id}
                      onClick={() => setSelectedSubject(subject)}
                      className={`px-3 py-1 rounded-md transition-colors duration-200 text-sm font-medium ${
                        selectedSubject?._id === subject._id
                          ? "bg-pink-500 text-white shadow"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      }`}
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))
        ) : (
          <p>
            There are no subjects assigned to you. An admin can assign subjects
            in the 'User Management' page.
          </p>
        )}
      </div>

      <hr className="my-6 border-t border-gray-200" />

      {selectedSubject && (
        <div className="animate-fade-in">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Assessments for:{" "}
            <span className="text-pink-600">
              {selectedSubject.name} ({selectedSubject.gradeLevel})
            </span>
          </h3>

          {/* Assessment search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search assessments by name, month, or marks"
              className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Existing Types List */}
            <div>
              <h4 className="font-bold text-gray-700 mb-3">Existing Types</h4>
              {assessmentsLoading ? (
                <p>Loading...</p>
              ) : (
                <ul className="space-y-2">
                  {filteredAssessmentTypes.length > 0 ? (
                    filteredAssessmentTypes.map((at) => (
                      <li
                        key={at._id}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded"
                      >
                        <span>
                          <strong>{at.month}:</strong> {at.name} (
                          {at.totalMarks} Marks)
                        </span>
                        <button
                          onClick={() => handleDelete(at._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold"
                        >
                          Delete
                        </button>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500">
                      No assessment types match your search.
                    </p>
                  )}
                </ul>
              )}
            </div>

            {/* Add New Assessment Type Form */}
            <div>
              <form
                onSubmit={handleCreate}
                className="bg-gray-50 p-4 rounded-lg border"
              >
                <h4 className="font-bold text-gray-700 mb-3">
                  Add New Assessment Type
                </h4>
                <div className="space-y-3">
                  <select
                    value={newAssessmentSemester}
                    onChange={(e) => setNewAssessmentSemester(e.target.value)}
                    className="shadow-sm border rounded w-full py-2 px-3"
                    required
                  >
                    <option value="" disabled>
                      -- Select Semester --
                    </option>
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                  </select>

                  <select
                    value={newAssessmentMonth}
                    onChange={(e) => setNewAssessmentMonth(e.target.value)}
                    className="shadow-sm border rounded w-full py-2 px-3"
                    required
                  >
                    <option value="" disabled>
                      -- Select Month --
                    </option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={newAssessmentName}
                    onChange={(e) => setNewAssessmentName(e.target.value)}
                    className="shadow-sm border rounded w-full py-2 px-3"
                    required
                  >
                    <option value="" disabled>
                      -- Select Assessment Type --
                    </option>
                    {ASSESSMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Total Marks"
                    value={newAssessmentMarks}
                    onChange={(e) => setNewAssessmentMarks(e.target.value)}
                    className="shadow-sm border rounded w-full py-2 px-3"
                    min="1"
                    required
                  />

                  <button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    + Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {error && selectedSubject && (
        <p className="text-red-500 text-center mt-4">{error}</p>
      )}
    </div>
  );
};

export default AssessmentTypesPage;
