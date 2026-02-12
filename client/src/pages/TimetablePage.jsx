
import React, { useState, useEffect } from "react";
import PeriodManager from "./PeriodManager";
import SubjectManager from "./SubjectManager";
import TimetableGrid from "./TimetableGrid";

const defaultDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday","Saturday"];

const TimetablePage = () => {
  const [periods, setPeriods] = useState([
    { id: 1, start: "09:00", end: "09:40" },
    { id: 2, start: "09:40", end: "10:20" },
    { id: 3, start: "10:20", end: "11:00" },
  ]);

  const [subjects, setSubjects] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [timetable, setTimetable] = useState([]);

  // ✅ AUTO GENERATE TIMETABLE
  useEffect(() => {
    if (!subjects.length || !periods.length) {
      setTimetable([]);
      return;
    }

    let subjectIndex = 0;

    const newTimetable = defaultDays.map((day) => {
      const dayPeriods = periods.map(() => {
        const subject = subjects[subjectIndex % subjects.length];
        subjectIndex++;
        return subject.name;
      });

      return {
        day,
        periods: dayPeriods,
      };
    });

    setTimetable(newTimetable);
  }, [subjects, periods.length]);

  const handlePrint = () => {
    window.print();
  };

 
  //   <div className="p-6">
  //     <h1 className="text-2xl font-bold mb-6">
  //       School Timetable Generator
  //     </h1>

  //     <PeriodManager periods={periods} setPeriods={setPeriods} />

  //     <SubjectManager
  //       selectedGrade={selectedGrade}
  //       setSelectedGrade={setSelectedGrade}
  //       subjects={subjects}
  //       setSubjects={setSubjects}
  //     />

  //     {timetable.length > 0 && (
  //       <TimetableGrid
  //         timetable={timetable}
  //         setTimetable={setTimetable}
  //         periods={periods}
  //         subjects={subjects}
  //       />
  //     )}

  //     <div className="mt-6">
  //       <button
  //         onClick={handlePrint}
  //         className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow"
  //       >
  //         Print Timetable
  //       </button>
  //     </div>
  //   </div>
  // );
return (
  <div className="p-6">

    {/* 🔴 Hide this section while printing */}
    <div className="no-print">
      <h1 className="text-2xl font-bold mb-6">
        School Timetable Generator
      </h1>

      <PeriodManager periods={periods} setPeriods={setPeriods} />

      <SubjectManager
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        subjects={subjects}
        setSubjects={setSubjects}
      />
    </div>

    {/* ✅ PRINT AREA */}
    {timetable.length > 0 && (
      <div id="printArea">
        <TimetableGrid
          timetable={timetable}
          setTimetable={setTimetable}
          periods={periods}
          subjects={subjects}
          selectedGrade={selectedGrade}
        />
      </div>
    )}

    {/* 🔴 Hide button while printing */}
    <div className="mt-6 no-print">
      <button
        onClick={handlePrint}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow"
      >
        Print Timetable
      </button>
    </div>

  </div>
);

};

export default TimetablePage;
