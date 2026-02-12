import React, { useEffect, useState } from "react";
import subjectService from "../services/subjectService";

const SubjectManager = ({
  selectedGrade,
  setSelectedGrade,
  subjects,
  setSubjects,
}) => {
  const [gradeOptions, setGradeOptions] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all grades
  useEffect(() => {
    const fetchAllSubjects = async () => {
      try {
        const response = await subjectService.getAllSubjects();
        const allSubjects = response.data.data;

        const uniqueGrades = [...new Set(allSubjects.map((s) => s.gradeLevel))];

        setGradeOptions(uniqueGrades);
      } catch (error) {
        console.error("Failed to load grades", error);
      }
    };

    fetchAllSubjects();
  }, []);

  // Fetch subjects when grade changes
  useEffect(() => {
    if (!selectedGrade) {
      setSubjects([]);
      return;
    }

    const fetchSubjectsByGrade = async () => {
      setLoading(true);
      try {
        const response = await subjectService.getAllSubjects(selectedGrade);

        setSubjects(response.data.data);
      } catch (error) {
        console.error("Failed to fetch subjects", error);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectsByGrade();
  }, [selectedGrade]);

  const addSubject = async () => {
    if (!newSubject.trim() || !selectedGrade) return;

    try {
      const newSubjectData = {
        name: newSubject.trim(),
        gradeLevel: selectedGrade,
      };

      const response = await subjectService.createSubject(newSubjectData);

      setSubjects((prev) => [...prev, response.data.data]);
      setNewSubject("");
    } catch (error) {
      console.error("Failed to create subject", error);
    }
  };

  const deleteSubject = async (id) => {
    try {
      await subjectService.deleteSubject(id);
      setSubjects((prev) => prev.filter((sub) => sub._id !== id));
    } catch (error) {
      console.error("Failed to delete subject", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Manage Subjects (Grade-wise)
      </h2>

      <div className="mb-4">
        <select
          value={selectedGrade || ""}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Select Grade</option>
          {gradeOptions.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </div>

      {selectedGrade && (
        <>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Enter subject name"
              className="border p-2 rounded w-full"
            />
            <button
              onClick={addSubject}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add
            </button>
          </div>

          {loading ? (
            <p>Loading subjects...</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {subjects.length > 0 ? (
                subjects.map((sub) => (
                  <div
                    key={sub._id}
                    className="bg-gray-200 px-3 py-1 rounded flex items-center gap-2"
                  >
                    {sub.name}
                    <button
                      onClick={() => deleteSubject(sub._id)}
                      className="text-red-500 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <p>No subjects found for this grade.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubjectManager;
