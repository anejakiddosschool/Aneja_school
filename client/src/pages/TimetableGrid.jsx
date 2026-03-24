

import React from "react";

const TimetableGrid = ({
  timetable,
  setTimetable,
  periods,
  subjects,
  selectedGrade,
}) => {
  const handleChange = (rowIndex, colIndex, value) => {
    const updated = [...timetable];
    updated[rowIndex].periods[colIndex] = value;
    setTimetable(updated);
  };

  const today = new Date().getFullYear();

  const getFontSize = () => {
    if (periods.length >= 9) return "text-[9px]";
    if (periods.length >= 7) return "text-[10px]";
    return "text-sm";
  };

  const isLandscape = periods.length > 8;

  // Subject colors - you can expand this as needed
  const subjectColors = [
    "bg-red-200",
    "bg-yellow-200",
    "bg-green-200",
    "bg-blue-200",
    "bg-pink-200",
    "bg-purple-200",
    "bg-orange-200",
    "bg-teal-200",
    "bg-indigo-200",
  ];

  // Map each subject name to a color
  const subjectColorMap = {};
  subjects.forEach((sub, index) => {
    subjectColorMap[sub.name] = subjectColors[index % subjectColors.length];
  });
  subjectColorMap["Free"] = "bg-gray-100"; // Free periods

  return (
    <div id="printArea" className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl">
  
      <div className="text-center mb-6">
        {/* School Logo */}
        <img
          src="https://res.cloudinary.com/dglf4qtfh/image/upload/v1769149286/UNMARK_LOGO_copy_1_sylwd0.png" // Replace with your logo URL
          alt="Aneja Kiddos School Logo"
          className="mx-auto  w-25 h-25 object-contain "
        />



        <p className="text-lg font-semibold  text-gray-700">
          Weekly Class Timetable
        </p>

        <p className="mt-1 text-gray-600">
          Grade: <span className="font-bold text-black">{selectedGrade}</span>
        </p>

        <p className="text-sm mt-1 text-gray-500">
          Academic Year: {today}-{today + 1}
        </p>
      </div>

      {/* 🔹 TABLE */}
      <div className="overflow-x-auto">
        <table
          className={`w-full table-fixed border border-black text-center shadow-md rounded-lg ${isLandscape ? "text-xs" : getFontSize()}`}
        >
          <thead>
            <tr className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200">
              <th className="border border-black p-2 font-semibold text-sm">
                Day
              </th>

              {periods.map((period, i) => (
                <th key={i} className="border border-black p-2 font-semibold">
                  <div className="font-bold text-gray-800">Period {i + 1}</div>
                  <div className="text-xs text-gray-600">
                    {period.start} - {period.end}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {timetable.map((row, rowIndex) => (
              <tr
                key={row.day}
                className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="border border-black p-2 font-semibold text-gray-700">
                  {row.day}
                </td>

                {row.periods.map((subject, colIndex) => (
                  <td
                    key={colIndex}
                    className={`border border-black p-2  transition duration-300 hover:scale-105 ${
                      subjectColorMap[subject] || "bg-gray-100"
                    }`}
                  >
                    <select
                      value={subject}
                      onChange={(e) =>
                        handleChange(rowIndex, colIndex, e.target.value)
                      }
                      className="w-full bg-transparent text-center outline-none print:hidden cursor-pointer"
                    >
                      <option value="Free">Free</option>

                      {subjects.map((sub) => (
                        <option key={sub._id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>

                    {/* Show plain text in print */}
                    <div className="hidden print:block">{subject}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 SIGNATURE SECTION */}
      <div className="flex justify-between mt-12 md:mt-16 text-sm">
        <div className="text-center">
          ___________________________
          <p>Class Teacher Signature</p>
        </div>

        <div className="text-center">
          ___________________________
          <p>Principal Signature</p>
        </div>
      </div>
    </div>
  );
};

export default TimetableGrid;
