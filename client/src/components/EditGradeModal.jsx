
// import React, { useState, useEffect } from "react";
// import gradeService from "../services/gradeService";
// import assessmentTypeService from "../services/assessmentTypeService";
// import toast from "react-hot-toast";

// const EditGradeModal = ({ gradeId, onClose, onUpdate }) => {
//   const [gradeData, setGradeData] = useState(null);
//   const [assessmentTypes, setAssessmentTypes] = useState([]);
//   const [scores, setScores] = useState({});
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadGradeData = async () => {
//       try {
//         const gradeRes = await gradeService.getGradeById(gradeId);
//         const fetchedGrade = gradeRes.data.data;
        
//         // 🌟 SAFETY CHECK: Agar Subject Delete ho gaya hai DB se
//         if (!fetchedGrade.subject) {
//             toast.error("Cannot edit this grade because its Subject has been deleted from the database.");
//             onClose();
//             return;
//         }

//         setGradeData(fetchedGrade);

//         const assessmentRes = await assessmentTypeService.getBySubject(
//           fetchedGrade.subject._id
//         );
//         setAssessmentTypes(assessmentRes.data.data);

//         const initialScores = {};
//         assessmentRes.data.data.forEach((at) => {
//           const existingScore = fetchedGrade.assessments.find(
//             (a) => a.assessmentType === at._id
//           );
//           initialScores[at._id] = existingScore ? existingScore.score : 0;
//         });
//         setScores(initialScores);
//       } catch (err) {
//         toast.error("Failed to load grade data for editing.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadGradeData();
//   }, [gradeId, onClose]);

//   const handleScoreChange = (assessmentTypeId, value) => {
//     const assessmentDef = assessmentTypes.find(
//       (at) => at._id === assessmentTypeId
//     );
//     if (!assessmentDef) return;

//     let newScore = Number(value);
//     if (newScore > assessmentDef.totalMarks)
//       newScore = assessmentDef.totalMarks;
//     if (newScore < 0) newScore = 0;

//     setScores((prevScores) => ({
//       ...prevScores,
//       [assessmentTypeId]: newScore,
//     }));
//   };

//   const currentFinalScore = Object.values(scores).reduce(
//     (sum, val) => sum + (val || 0),
//     0
//   );

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const assessmentsPayload = Object.keys(scores).map((id) => ({
//       assessmentType: id,
//       score: scores[id],
//     }));

//     try {
//       await gradeService.updateGrade(gradeId, {
//         assessments: assessmentsPayload,
//       });
//       toast.success("Grade updated successfully!");
//       onUpdate();
//       onClose();
//     } catch (err) {
//       const msg = err.response?.data?.message || "Failed to update grade.";
//       toast.error(msg);
//     }
//   };

//   if (loading) return <p className="p-4 text-center">Loading grade data...</p>;
//   if (!gradeData) return null;

//   return (
//     <div className="fixed inset-0 bg-opacity-50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
//       <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 overflow-auto max-h-[90vh]">
//         <h2 className="text-xl font-bold mb-4">
//           Edit Grade: {gradeData.subject?.name || "Unknown Subject"}
//         </h2>
//         <form onSubmit={handleSubmit}>
//           {assessmentTypes.map((at) => (
//             <div key={at._id} className="mb-4">
//               <label htmlFor={at._id} className="block font-semibold mb-1">
//                 {at.name} (out of {at.totalMarks})
//               </label>
//               <input
//                 id={at._id}
//                 type="number"
//                 step="any"
//                 value={scores[at._id] || 0}
//                 onChange={(e) => handleScoreChange(at._id, e.target.value)}
//                 min={0}
//                 max={at.totalMarks}
//                 className="border rounded px-3 py-2 w-full"
//                 required
//               />
//             </div>
//           ))}

//           <div className="text-right text-2xl font-bold text-gray-800 mt-4 p-4 bg-gray-100 rounded-lg">
//             Final Score:{" "}
//             <span className="text-pink-600">{currentFinalScore}</span>
//           </div>

//           <div className="flex justify-end gap-3 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded"
//             >
//               Update Grade
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditGradeModal;

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
        
        // 🌟 SAFETY CHECK: Agar Subject Delete ho gaya hai DB se
        if (!fetchedGrade.subject) {
            toast.error("Cannot edit this grade because its Subject has been deleted from the database.");
            onClose();
            return;
        }

        setGradeData(fetchedGrade);

        // Fetch all assessments for this subject
        const assessmentRes = await assessmentTypeService.getBySubject(
          fetchedGrade.subject._id
        );
        
        // 🌟 FILTER: Sirf usi semester ke assessments show karo jo is grade row ka semester hai
        const allAssessments = assessmentRes.data.data;
        const currentSemester = fetchedGrade.semester; // e.g., "First Semester"

        const filteredAssessments = allAssessments.filter(
            (at) => at.semester === currentSemester
        );

        setAssessmentTypes(filteredAssessments);

        const initialScores = {};
        // Use ONLY filtered assessments to build the input fields state
        filteredAssessments.forEach((at) => {
          const existingScore = fetchedGrade.assessments.find(
            (a) => a.assessmentType === at._id || a.assessmentType?._id === at._id
          );
          initialScores[at._id] = existingScore ? existingScore.score : 0;
        });
        setScores(initialScores);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load grade data for editing.");
      } finally {
        setLoading(false);
      }
    };
    loadGradeData();
  }, [gradeId, onClose]);

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

  if (loading) return <p className="p-4 text-center text-gray-500 font-medium">Loading grade data...</p>;
  if (!gradeData) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <div>
                <h2 className="text-2xl font-extrabold text-gray-800">
                Edit Grade
                </h2>
                <div className="flex gap-2 mt-2">
                    <span className="bg-pink-50 text-pink-700 text-xs font-bold px-2 py-1 rounded border border-pink-100 uppercase tracking-wide">
                        {gradeData.subject?.name || "Unknown Subject"}
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded border border-gray-200 uppercase tracking-wide">
                        {gradeData.semester}
                    </span>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                ✕
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {assessmentTypes.length === 0 ? (
             <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <span className="block text-2xl mb-2">⚠️</span>
                 <p className="text-gray-500 font-medium text-sm">No assessments found for {gradeData.semester}.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assessmentTypes.map((at) => (
                    <div key={at._id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-50 transition-all">
                    <label htmlFor={at._id} className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-700 text-sm">{at.name}</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded text-gray-500 font-bold border border-gray-200">Max: {at.totalMarks}</span>
                    </label>
                    <input
                        id={at._id}
                        type="number"
                        step="any"
                        value={scores[at._id] || 0}
                        onChange={(e) => handleScoreChange(at._id, e.target.value)}
                        min={0}
                        max={at.totalMarks}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 font-bold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                        required
                    />
                    </div>
                ))}
            </div>
          )}

          {assessmentTypes.length > 0 && (
            <div className="flex justify-between items-center mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-inner">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-sm">Total Calculated Score</span>
                <span className="text-3xl font-black text-pink-600 drop-shadow-sm">{currentFinalScore}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-50 text-gray-700 font-bold px-6 py-2.5 rounded-xl border border-gray-200 shadow-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assessmentTypes.length === 0}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-sm shadow-pink-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGradeModal;
