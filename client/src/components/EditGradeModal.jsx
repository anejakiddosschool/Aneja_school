import React, { useState, useEffect } from "react";
import gradeService from "../services/gradeService";
import assessmentTypeService from "../services/assessmentTypeService";
import toast from "react-hot-toast";

const EditGradeModal = ({ gradeId, onClose, onUpdate }) => {
  const [gradeData, setGradeData] = useState(null);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGradeData = async () => {
      try {
        const gradeRes = await gradeService.getGradeById(gradeId);
        const fetchedGrade = gradeRes.data.data;
        setGradeData(fetchedGrade);

        const assessmentRes = await assessmentTypeService.getBySubject(
          fetchedGrade.subject._id
        );
        setAssessmentTypes(assessmentRes.data.data);

        const initialScores = {};
        assessmentRes.data.data.forEach((at) => {
          const existingScore = fetchedGrade.assessments.find(
            (a) => a.assessmentType === at._id
          );
          initialScores[at._id] = existingScore ? existingScore.score : 0;
        });
        setScores(initialScores);
      } catch (err) {
        toast.error("Failed to load grade data for editing.");
      } finally {
        setLoading(false);
      }
    };
    loadGradeData();
  }, [gradeId]);

  const handleScoreChange = (assessmentTypeId, value) => {
    const assessmentDef = assessmentTypes.find(
      (at) => at._id === assessmentTypeId
    );
    if (!assessmentDef) return;

    let newScore = Number(value);
    if (newScore > assessmentDef.totalMarks)
      newScore = assessmentDef.totalMarks;
    if (newScore < 0) newScore = 0;

    setScores((prevScores) => ({
      ...prevScores,
      [assessmentTypeId]: newScore,
    }));
  };

  const currentFinalScore = Object.values(scores).reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const assessmentsPayload = Object.keys(scores).map((id) => ({
      assessmentType: id,
      score: scores[id],
    }));

    try {
      await gradeService.updateGrade(gradeId, {
        assessments: assessmentsPayload,
      });
      toast.success("Grade updated successfully!");
      onUpdate();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update grade.";
      toast.error(msg);
    }
  };

  if (loading) return <p className="p-4 text-center">Loading grade data...</p>;
  if (!gradeData) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">
          Edit Grade: {gradeData.subject.name}
        </h2>
        <form onSubmit={handleSubmit}>
          {assessmentTypes.map((at) => (
            <div key={at._id} className="mb-4">
              <label htmlFor={at._id} className="block font-semibold mb-1">
                {at.name} (out of {at.totalMarks})
              </label>
              <input
                id={at._id}
                type="number"
                step="any"
                value={scores[at._id] || 0}
                onChange={(e) => handleScoreChange(at._id, e.target.value)}
                min={0}
                max={at.totalMarks}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>
          ))}

          <div className="text-right text-2xl font-bold text-gray-800 mt-4 p-4 bg-gray-100 rounded-lg">
            Final Score:{" "}
            <span className="text-pink-600">{currentFinalScore}</span>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded"
            >
              Update Grade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGradeModal;
