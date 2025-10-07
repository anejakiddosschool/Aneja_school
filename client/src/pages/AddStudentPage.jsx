// src/pages/AddStudentPage.js
import React, { useState, useEffect} from "react";
import { useNavigate, Link } from "react-router-dom";
import studentService from "../services/studentService";

import subjectService from "../services/subjectService";

const AddStudentPage = () => {
  // --- State Management ---
  const [studentData, setStudentData] = useState({
    fullName: "",
    gender: "Male",
    dateOfBirth: "",
    gradeLevel: "",
    parentContact: { parentName: "", phone: "" },
    section: "",
    rollNumber: "",
    motherName: "",
    address: "",
    adhaarNumber: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // To show the auto-generated password
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
const [gradeOptions, setGradeOptions] = useState([]);


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


  useEffect(() => {
  const fetchGradeLevels = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      const subjects = response.data.data;
      // Get unique, sorted grade levels
      const uniqueGrades = [...new Set(subjects.map(s => s.gradeLevel))].sort();
      setGradeOptions(uniqueGrades);
    } catch (error) {
      // Optionally setError('Could not fetch grade levels');
    }
  };
  fetchGradeLevels();
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await studentService.createStudent(studentData);
      setSuccess(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create student.");
      setLoading(false);
    }
  };

  // --- Tailwind CSS class strings ---
  const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
  const textInput =
    "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
  const textAreaInput = `${textInput} h-24 resize-y`;
  const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${
    loading ? "opacity-50 cursor-not-allowed" : ""
  }`;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Student</h2>
      <Link to="/students" className="text-pink-500 hover:underline mb-6 block">
        ← Back to Students List
      </Link>

      {success ? (
        // --- Success Panel ---
        <div className="p-6 bg-green-50 border border-green-300 rounded-lg text-center">
          <h3 className="text-xl font-bold text-green-800">
            Student Created Successfully!
          </h3>
          <p className="mt-2 text-gray-700">
            Please provide these credentials to the parent. They will be
            required to change the password on first login.
          </p>
          <div className="mt-4 p-4 bg-gray-100 rounded-md inline-block">
            <p>
              <strong>Student ID / Username:</strong>{" "}
              <span className="font-mono text-lg">{success.studentId}</span>
            </p>
            <p>
              <strong>Initial Password:</strong>{" "}
              <span className="font-mono text-lg text-red-600">
                {success.initialPassword}
              </span>
            </p>
          </div>
          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Add Another Student
            </button>
            <Link
              to={`/students/${success._id}`}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Go to Student's Profile
            </Link>
          </div>
        </div>
      ) : (
        // --- Add Student Form ---
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className={inputLabel}>
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={studentData.fullName}
                onChange={handleChange}
                className={textInput}
                required
              />
            </div>
            <div>
              <label htmlFor="gradeLevel" className={inputLabel}>
                Grade Level
              </label>
              {/* <input
                id="gradeLevel"
                type="text"
                name="gradeLevel"
                value={studentData.gradeLevel}
                onChange={handleChange}
                className={textInput}
                placeholder="e.g., Grade 4"
                required
              /> */}
              <select
  id="gradeLevel"
  name="gradeLevel"
  value={studentData.gradeLevel}
  onChange={handleChange}
  className={textInput}
  required
>
  <option value="">Select Grade Level</option>
  {gradeOptions.map((grade) => (
    <option key={grade} value={grade}>
      {grade}
    </option>
  ))}
</select>

            </div>
            <div>
              <label htmlFor="gender" className={inputLabel}>
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={studentData.gender}
                onChange={handleChange}
                className={textInput}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label htmlFor="dateOfBirth" className={inputLabel}>
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                name="dateOfBirth"
                value={studentData.dateOfBirth}
                onChange={handleChange}
                className={textInput}
                required
              />
            </div>
            <div>
              <label htmlFor="rollNumber" className={inputLabel}>
                Roll No
              </label>
              <input
                id="rollNumber"
                type="text"
                name="rollNumber"
                value={studentData.rollNumber}
                onChange={handleChange}
                className={textInput}
                required
              />
            </div>
        
            <div>
              <label htmlFor="motherName" className={inputLabel}>
             Mother Name
              </label>
              <input
                id="motherName"
                type="text"
                name="motherName"
                value={studentData.motherName}
                onChange={handleChange}
                className={textInput}
                required
              />
            </div>
            <div>
              <label htmlFor="address" className={inputLabel}>
                Address
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={studentData.address}
                onChange={handleChange}
                className={textInput}
                required
              />
            </div>
            <div>
              <label htmlFor="adhaarNumber" className={inputLabel}>
                Aadhaar Card Number
              </label>
              <input
                id="adhaarNumber"
                type="text"
                name="adhaarNumber"
                value={studentData.adhaarNumber}
                onChange={handleChange}
                className={textInput}
                required
              />
            </div>
          </div>
          <fieldset className="mt-8 border-t pt-6">
            <legend className="text-xl font-bold text-gray-700 mb-4">
              Parent/Guardian Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="parentName" className={inputLabel}>
                  Parent's Name
                </label>
                <input
                  id="parentName"
                  type="text"
                  name="parentContact.parentName"
                  value={studentData.parentContact.parentName}
                  onChange={handleChange}
                  className={textInput}
                />
              </div>
              <div>
                <label htmlFor="phone" className={inputLabel}>
                  Parent's Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="parentContact.phone"
                  value={studentData.parentContact.phone}
                  onChange={handleChange}
                  className={textInput}
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="mt-8 border-t pt-6">
            <legend className="text-xl font-bold text-gray-700 mb-4">
              Section Information
            </legend>
            <div>
              <label htmlFor="section" className={inputLabel}>
                Section
              </label>
              <textarea
                id="section"
                name="section"
                value={studentData.section}
                onChange={handleChange}
                className={textAreaInput}
                placeholder="Enter Section Name"
              />
            </div>
          </fieldset>
          <div className="mt-8">
            <button type="submit" className={submitButton} disabled={loading}>
              {loading ? "Saving..." : "Create Student & Generate Credentials"}
            </button>
          </div>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default AddStudentPage;
