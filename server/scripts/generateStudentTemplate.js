// Generates client/public/student-template.xlsx
// Run: node scripts/generateStudentTemplate.js  (from the server/ folder)
const xlsx = require("xlsx");
const path = require("path");

const headers = [
  "Full Name",
  "Gender",
  "Date of Birth",
  "Roll No",
  "Grade Level",
  "Section",
  "Parent Name",
  "Parent Phone",
  "Mother's Name",
  "Address",
  "Aadhaar Card Number",
];

// Sample rows — Date of Birth is written as DD-MM-YYYY (Day-Month-Year)
const sampleRows = [
  ["Aarav Sharma", "Male", "15-05-2010", 1, "6", "A", "Rajesh Sharma", "9876543210", "Sunita Sharma", "123, Model Town, Delhi", "123456789012"],
  ["Priya Singh", "Female", "22-08-2011", 2, "6", "A", "Mohan Singh", "9876500011", "Rekha Singh", "45, Civil Lines, Delhi", "234567890123"],
  ["Rohan Verma", "Male", "03-01-2012", 3, "6", "B", "Anil Verma", "9812345678", "Kavita Verma", "78, Rohini, Delhi", "345678901234"],
];

const worksheet = xlsx.utils.aoa_to_sheet([headers, ...sampleRows]);

// Make the Date of Birth column (C) display as DD-MM-YYYY text
const range = xlsx.utils.decode_range(worksheet["!ref"]);
for (let row = range.s.r + 1; row <= range.e.r; row++) {
  const cell = worksheet[xlsx.utils.encode_cell({ r: row, c: 2 })];
  if (cell) {
    cell.t = "s";
    cell.v = String(cell.v);
    cell.z = "@";
  }
}

worksheet["!cols"] = [
  { wch: 20 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 12 },
  { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 20 },
];

const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Students");

const outPath = path.join(__dirname, "..", "..", "client", "public", "student-template.xlsx");
xlsx.writeFile(workbook, outPath);
console.log("Template generated:", outPath);
