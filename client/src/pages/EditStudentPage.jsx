// // src/pages/EditStudentPage.js
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import studentService from "../services/studentService";
// import smallApi from "../services/api";

// const EditStudentPage = () => {
//   const { id: studentId } = useParams();
//   const navigate = useNavigate();

//   // --- State Management ---
//   const [studentData, setStudentData] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // --- Data Fetching ---
//   useEffect(() => {
//     studentService
//       .getStudentById(studentId)
//       .then((res) => {
//         const data = res.data.data;
//         if (!data.parentContact) {
//           data.parentContact = { parentName: "", phone: "", email: "" };
//         }
//         data.dateOfBirth = data.dateOfBirth
//           ? new Date(data.dateOfBirth).toISOString().split("T")[0]
//           : "";
//         setStudentData(data);
//       })
//       .catch(() => setError("Failed to load student data."))
//       .finally(() => setLoading(false));
//   }, [studentId]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name.startsWith("parentContact.")) {
//       const field = name.split(".")[1];
//       setStudentData((prev) => ({
//         ...prev,
//         parentContact: { ...prev.parentContact, [field]: value },
//       }));
//     } else {
//       setStudentData((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   const handlePhotoUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setError(null);

//     if (!file.type.startsWith("image/")) {
//       setError("Only image files are allowed.");
//       return;
//     }

//     try {
//       const res = await studentService.uploadPhoto(studentId, file);

//       setStudentData((prev) => ({
//         ...prev,
//         imageUrl: res.data.imageUrl,
//       }));
//     } catch (err) {
//       console.error("Upload error:", err);
//       setError("Photo upload failed. Please ensure it is a valid image file.");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     try {
//       await studentService.updateStudent(studentId, studentData);
//       alert("Student profile updated successfully!");
//       navigate("/students");
//     } catch (err) {
//       setError("Failed to update student profile.");
//     }
//   };

//   if (loading)
//     return (
//       <p className="text-center text-lg mt-8">Loading student profile...</p>
//     );
//   if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
//   if (!studentData) return null; // Render nothing if data is not available yet

//   // --- Tailwind CSS class strings ---
//   const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
//   const textInput =
//     "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
//   const textAreaInput = `${textInput} h-24 resize-y`;
//   const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200`;

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
//       <h2 className="text-2xl font-bold text-gray-800 mb-4">
//         Edit Student Profile
//       </h2>
//       <Link to="/students" className="text-pink-500 hover:underline mb-6 block">
//         ← Back to Students List
//       </Link>

//       <form onSubmit={handleSubmit}>
//         {/* --- Photo Upload Section --- */}
//         <div className="flex flex-col items-center mb-6">
//           <img
//             src={
//               `${studentData.imageUrl}`
//                 ? `${studentData.imageUrl}`
//                 : `${smallApi}/${studentData.imageUrl}?key=${Date.now()}`
//             } // Added cache-busting key
//             alt={`${studentData.fullName}'s profile`}
//             className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-4"
//           />
//           <label
//             htmlFor="photo-upload"
//             className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
//           >
//             Change Photo
//           </label>
//           <input
//             id="photo-upload"
//             type="file"
//             onChange={handlePhotoUpload}
//             className="hidden"
//             accept="image/*"
//           />
//         </div>

//         {/* --- Main Details Grid --- */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label htmlFor="fullName" className={inputLabel}>
//               Full Name
//             </label>
//             <input
//               id="fullName"
//               type="text"
//               name="fullName"
//               value={studentData.fullName}
//               onChange={handleChange}
//               className={textInput}
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="gradeLevel" className={inputLabel}>
//               Grade Level
//             </label>
//             <input
//               id="gradeLevel"
//               type="text"
//               name="gradeLevel"
//               value={studentData.gradeLevel}
//               onChange={handleChange}
//               className={textInput}
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="gender" className={inputLabel}>
//               Gender
//             </label>
//             <select
//               id="gender"
//               name="gender"
//               value={studentData.gender}
//               onChange={handleChange}
//               className={textInput}
//             >
//               <option value="Male">Male</option>
//               <option value="Female">Female</option>
//             </select>
//           </div>
//           <div>
//             <label htmlFor="dateOfBirth" className={inputLabel}>
//               Date of Birth
//             </label>
//             <input
//               id="dateOfBirth"
//               type="date"
//               name="dateOfBirth"
//               value={studentData.dateOfBirth}
//               onChange={handleChange}
//               className={textInput}
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="rollNumber" className={inputLabel}>
//               Roll No
//             </label>
//             <input
//               id="rollNumber"
//               type="text"
//               name="rollNumber"
//               value={studentData.rollNumber}
//               onChange={handleChange}
//               className={textInput}
//               required
//             />
//           </div>

//           <div>
//             <label htmlFor="motherName" className={inputLabel}>
//               Mother Name
//             </label>
//             <input
//               id="motherName"
//               type="text"
//               name="motherName"
//               value={studentData.motherName}
//               onChange={handleChange}
//               className={textInput}
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="address" className={inputLabel}>
//               Address
//             </label>
//             <input
//               id="address"
//               type="text"
//               name="address"
//               value={studentData.address}
//               onChange={handleChange}
//               className={textInput}
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="adhaarNumber" className={inputLabel}>
//               Aadhaar Card Number
//             </label>
//             <input
//               id="adhaarNumber"
//               type="text"
//               name="adhaarNumber"
//               value={studentData.adhaarNumber}
//               onChange={handleChange}
//               className={textInput}
//               required
//             />
//           </div>
//         </div>

//         {/* --- Parent Contact Section --- */}
//         <fieldset className="mt-8 border-t pt-6">
//           <legend className="text-xl font-bold text-gray-700 mb-4">
//             Parent/Guardian Details
//           </legend>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label htmlFor="parentName" className={inputLabel}>
//                 Parent's Name
//               </label>
//               <input
//                 id="parentName"
//                 type="text"
//                 name="parentContact.parentName"
//                 value={studentData.parentContact.parentName}
//                 onChange={handleChange}
//                 className={textInput}
//               />
//             </div>
//             <div>
//               <label htmlFor="phone" className={inputLabel}>
//                 Parent's Phone
//               </label>
//               <input
//                 id="phone"
//                 type="tel"
//                 name="parentContact.phone"
//                 value={studentData.parentContact.phone}
//                 onChange={handleChange}
//                 className={textInput}
//               />
//             </div>
//           </div>
//         </fieldset>

//         {/* --- section Status Section --- */}
//         <fieldset className="mt-8 border-t pt-6">
//           <legend className="text-xl font-bold text-gray-700 mb-4">
//             Section Information
//           </legend>
//           <div>
//             <label htmlFor="section" className={inputLabel}>
//               Section
//             </label>
//             <textarea
//               id="section"
//               name="section"
//               value={studentData.section}
//               onChange={handleChange}
//               className={textAreaInput}
//             />
//           </div>
//         </fieldset>

//         <div className="mt-8">
//           <button type="submit" className={submitButton}>
//             Save Changes
//           </button>
//         </div>
//         {error && <p className="text-red-500 text-center mt-4">{error}</p>}
//       </form>
//     </div>
//   );
// };

// export default EditStudentPage;


// src/pages/EditStudentPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import studentService from "../services/studentService";
import smallApi from "../services/api";

const EditStudentPage = () => {
  const { id: studentId } = useParams();
  const navigate = useNavigate();

  // --- State Management ---
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  useEffect(() => {
    studentService
      .getStudentById(studentId)
      .then((res) => {
        const data = res.data.data;
        if (!data.parentContact) {
          data.parentContact = { parentName: "", phone: "", email: "" };
        }
        data.dateOfBirth = data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().split("T")[0]
          : "";
        setStudentData(data);
      })
      .catch(() => setError("Failed to load student data."))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("parentContact.")) {
      const field = name.split(".")[1];
      setStudentData((prev) => ({
        ...prev,
        parentContact: { ...prev.parentContact, [field]: value },
      }));
    } else {
      setStudentData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    try {
      const res = await studentService.uploadPhoto(studentId, file);
      setStudentData((prev) => ({
        ...prev,
        imageUrl: res.data.imageUrl,
      }));
    } catch (err) {
      console.error("Upload error:", err);
      setError("Photo upload failed. Please ensure it is a valid image file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await studentService.updateStudent(studentId, studentData);
      navigate("/students");
    } catch (err) {
      setError("Failed to update student profile.");
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><div className="w-10 h-10 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div></div>;
  if (error && !studentData) return <p className="text-center text-red-600 font-bold bg-red-50 p-4 rounded-xl max-w-lg mx-auto mt-10">{error}</p>;
  if (!studentData) return null;

  // --- Styled Class Strings ---
  const inputLabel = "block text-gray-600 text-xs font-bold uppercase tracking-wider mb-2";
  const textInput = "w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-800 text-sm font-medium focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-gray-50 hover:bg-white transition-all";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-fade-in pb-20">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* BACK LINK */}
        <Link to="/students" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-pink-600 transition-colors">
            <span className="mr-1">←</span> Back to Directory
        </Link>

        {/* HEADER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 text-2xl">
                📝
            </div>
            <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Edit Student Profile</h2>
                <p className="text-sm text-gray-500 font-medium">Updating records for <span className="font-bold text-gray-800">{studentData.fullName}</span></p>
            </div>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-sm text-sm font-semibold text-center">
                ⚠️ {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* PHOTO UPLOAD SECTION */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="relative group">
                <img
                    src={studentData.imageUrl ? `${studentData.imageUrl}` : `${smallApi}/${studentData.imageUrl}?key=${Date.now()}`}
                    alt="Student profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-gray-100"
                    onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + studentData.fullName + "&background=fbcfe8&color=be185d&size=128" }}
                />
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center cursor-pointer shadow-md text-gray-500 hover:text-pink-600 hover:border-pink-300 transition-colors group-hover:scale-110">
                    📷
                </label>
                <input id="photo-upload" type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </div>
            <h3 className="mt-4 font-bold text-gray-800">{studentData.fullName}</h3>
            <p className="text-xs text-gray-500 font-mono">ID: {studentData.studentId}</p>
          </div>

          {/* PERSONAL INFO SECTION */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                <span>👤</span> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="fullName" className={inputLabel}>Full Name</label>
                    <input id="fullName" type="text" name="fullName" value={studentData.fullName} onChange={handleChange} className={textInput} required />
                </div>
                <div>
                    <label htmlFor="dateOfBirth" className={inputLabel}>Date of Birth</label>
                    <input id="dateOfBirth" type="date" name="dateOfBirth" value={studentData.dateOfBirth} onChange={handleChange} className={textInput} required />
                </div>
                <div>
                    <label htmlFor="gender" className={inputLabel}>Gender</label>
                    <select id="gender" name="gender" value={studentData.gender} onChange={handleChange} className={textInput}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="adhaarNumber" className={inputLabel}>Aadhaar Card Number</label>
                    <input id="adhaarNumber" type="text" name="adhaarNumber" value={studentData.adhaarNumber} onChange={handleChange} className={textInput} required />
                </div>
            </div>
          </div>

          {/* ACADEMIC INFO SECTION */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                <span>🏫</span> Academic Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="gradeLevel" className={inputLabel}>Grade Level (Class)</label>
                    <input id="gradeLevel" type="text" name="gradeLevel" value={studentData.gradeLevel} onChange={handleChange} className={textInput} required />
                </div>
                <div>
                    <label htmlFor="section" className={inputLabel}>Section</label>
                    <input id="section" type="text" name="section" value={studentData.section || ''} onChange={handleChange} className={textInput} placeholder="e.g. A, B, Rose" />
                </div>
                <div>
                    <label htmlFor="rollNumber" className={inputLabel}>Roll Number</label>
                    <input id="rollNumber" type="text" name="rollNumber" value={studentData.rollNumber} onChange={handleChange} className={textInput} required />
                </div>
            </div>
          </div>

          {/* FAMILY & CONTACT INFO */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                <span>👪</span> Family & Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="motherName" className={inputLabel}>Mother's Name</label>
                    <input id="motherName" type="text" name="motherName" value={studentData.motherName} onChange={handleChange} className={textInput} required />
                </div>
                <div>
                    <label htmlFor="parentName" className={inputLabel}>Father/Guardian's Name</label>
                    <input id="parentName" type="text" name="parentContact.parentName" value={studentData.parentContact.parentName} onChange={handleChange} className={textInput} required />
                </div>
                <div>
                    <label htmlFor="phone" className={inputLabel}>Primary Contact Phone</label>
                    <input id="phone" type="tel" name="parentContact.phone" value={studentData.parentContact.phone} onChange={handleChange} className={textInput} required placeholder="10 digit number" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="address" className={inputLabel}>Full Residential Address</label>
                    <input id="address" type="text" name="address" value={studentData.address} onChange={handleChange} className={textInput} required />
                </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-end">
            <button type="submit" className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-10 rounded-xl shadow-md transition-all hover:-translate-y-0.5">
                Save Profile Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditStudentPage;
