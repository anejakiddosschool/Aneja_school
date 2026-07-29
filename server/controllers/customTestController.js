// server/controllers/customTestController.js
const CustomTest = require('../models/CustomTest');
const CustomTestGrade = require('../models/CustomTestGrade');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const PDFDocument = require('pdfkit');
const { sendWhatsAppDocument } = require('../whatsappClient');

// Concurrency helper: run async tasks with a max number of parallel operations
async function runWithConcurrency(tasks, concurrency = 5) {
    const results = [];
    const taskIterator = tasks.entries();
    
    async function worker() {
        for (const [index, task] of taskIterator) {
            try {
                results[index] = await task();
            } catch (err) {
                results[index] = err;
            }
        }
    }
    
    const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

// ===================== TEST CRUD =====================

// @desc    Create a new custom test
// @route   POST /api/custom-tests
exports.createCustomTest = async (req, res) => {
    try {
        const { name, subjectId, gradeLevel, totalMarks, semester, academicYear } = req.body;

        if (!name || !subjectId || !gradeLevel || !totalMarks) {
            return res.status(400).json({ message: 'Name, subject, grade level, and total marks are required.' });
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found.' });
        }

        // 👑 PERMISSION CHECK:
        // - Admin: full access
        // - Teacher: only if subject is assigned OR if they are homeroom teacher for this grade
        if (req.user.role !== 'admin') {
            const isAssigned = req.user.subjectsTaught.some(
                assignment => assignment.subject && assignment.subject.toString() === subjectId.toString()
            );
            const isHomeroom = req.user.homeroomGrade && req.user.homeroomGrade === subject.gradeLevel;

            if (!isAssigned && !isHomeroom) {
                return res.status(403).json({ 
                    message: 'Forbidden: You are not assigned to this subject nor are you the homeroom teacher for this grade.' 
                });
            }
        }

        const customTest = await CustomTest.create({
            name: name.trim(),
            subject: subjectId,
            gradeLevel,
            totalMarks: Number(totalMarks),
            createdBy: req.user._id,
            semester: semester || 'First Semester',
            academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        });

        res.status(201).json({ success: true, data: customTest });
    } catch (error) {
        console.error('Create custom test error:', error);
        res.status(500).json({ message: 'Server error creating test.' });
    }
};

// @desc    Get all custom tests (filtered by subject/gradeLevel)
// @route   GET /api/custom-tests
exports.getCustomTests = async (req, res) => {
    try {
        const { subjectId, gradeLevel } = req.query;
        const filter = {};

        if (subjectId) filter.subject = subjectId;
        if (gradeLevel) filter.gradeLevel = gradeLevel;

        // If teacher (not admin), only show their tests
        if (req.user.role !== 'admin') {
            filter.createdBy = req.user._id;
        }

        const tests = await CustomTest.find(filter)
            .populate('subject', 'name gradeLevel')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: tests.length, data: tests });
    } catch (error) {
        console.error('Get custom tests error:', error);
        res.status(500).json({ message: 'Server error fetching tests.' });
    }
};

// @desc    Get a single custom test
// @route   GET /api/custom-tests/:id
exports.getCustomTestById = async (req, res) => {
    try {
        const test = await CustomTest.findById(req.params.id)
            .populate('subject', 'name gradeLevel')
            .populate('createdBy', 'fullName');

        if (!test) {
            return res.status(404).json({ message: 'Test not found or may have been auto-deleted.' });
        }

        res.json({ success: true, data: test });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Delete a custom test (and its grades)
// @route   DELETE /api/custom-tests/:id
exports.deleteCustomTest = async (req, res) => {
    try {
        const test = await CustomTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found.' });
        }

        // Delete all associated grades
        await CustomTestGrade.deleteMany({ customTest: test._id });
        await test.deleteOne();

        res.json({ success: true, message: 'Test and all associated grades deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ===================== MARKS ENTRY =====================

// @desc    Get students for marks entry (for a specific custom test)
// @route   GET /api/custom-tests/:id/students
exports.getTestStudents = async (req, res) => {
    try {
        const test = await CustomTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found.' });
        }

        // Get all active students for this grade level
        const students = await Student.find({ 
            gradeLevel: test.gradeLevel, 
            status: 'Active' 
        }).sort({ fullName: 1 }).select('fullName studentId parentContact rollNumber');

        // Get existing grades for this test
        const existingGrades = await CustomTestGrade.find({ customTest: test._id });
        const gradeMap = {};
        existingGrades.forEach(g => {
            gradeMap[g.student.toString()] = g.score;
        });

        // Combine student data with existing scores
        const studentList = students.map(s => ({
            _id: s._id,
            fullName: s.fullName,
            studentId: s.studentId,
            rollNumber: s.rollNumber,
            parentContact: s.parentContact,
            score: gradeMap[s._id.toString()] !== undefined ? gradeMap[s._id.toString()] : null
        }));

        res.json({
            success: true,
            test: {
                _id: test._id,
                name: test.name,
                totalMarks: test.totalMarks,
                expiresAt: test.expiresAt
            },
            count: studentList.length,
            data: studentList
        });
    } catch (error) {
        console.error('Get test students error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Save marks for students in a custom test
// @route   POST /api/custom-tests/:id/marks
exports.saveTestMarks = async (req, res) => {
    try {
        const { scores } = req.body; // Array of { studentId, score }

        if (!scores || !Array.isArray(scores)) {
            return res.status(400).json({ message: 'Scores array is required.' });
        }

        const test = await CustomTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found.' });
        }

        const results = [];

        for (const item of scores) {
            if (item.score === null || item.score === undefined || item.score === '') continue;

            const scoreValue = Number(item.score);
            if (scoreValue > test.totalMarks) {
                return res.status(400).json({ 
                    message: `Score ${scoreValue} exceeds total marks (${test.totalMarks}) for student ${item.studentId}.` 
                });
            }

            // Upsert: create or update
            const grade = await CustomTestGrade.findOneAndUpdate(
                { customTest: test._id, student: item.studentId },
                {
                    $set: {
                        score: scoreValue,
                        subject: test.subject,
                        gradeLevel: test.gradeLevel
                    }
                },
                { upsert: true, new: true }
            );

            results.push(grade);
        }

        res.json({ success: true, message: `Marks saved for ${results.length} students.`, count: results.length });
    } catch (error) {
        console.error('Save marks error:', error);
        res.status(500).json({ message: 'Server error saving marks.' });
    }
};

// ===================== PDF GENERATION =====================
// EXACT replica of ReportCardPage CSS/HTML design
// Colors, layout, logo, student details — all matching the real report card

const https = require('https');
const NAVY = '#0b3b78';
const ORANGE = '#ed8544';
const DARK = '#0f172a';
const MUTED = '#6b7280';
const BORDER = '#d1d5db';
const CARD_BG = '#f8fafc';
const PAGE_TOP = 36;
const LOGO_URL = 'https://res.cloudinary.com/dityqhoqp/image/upload/v1757673591/UNMARK_LOGO_copy_1_nonp8j.png';

/** Fetch an image from a URL and return as Buffer */
function fetchImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

const generateTestPdf = async (studentInfo, testInfo) => {
    // studentInfo: { fullName, studentId, rollNumber, gradeLevel, section, gender, dateOfBirth, motherName, parentName }
    // testInfo: { testName, subjectName, totalMarks, score, dateStr }

    const { fullName, studentId, rollNumber, gradeLevel, section, gender, dateOfBirth, motherName, parentName } = studentInfo;
    const { testName, subjectName, totalMarks, score, dateStr, teacherName } = testInfo;

    // Fetch the school logo
    let logoBuffer;
    try {
        logoBuffer = await fetchImage(LOGO_URL);
    } catch (e) {
        logoBuffer = null;
    }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 36,
                info: {
                    Title: `${testName} - ${fullName}`,
                    Author: 'Aneja Kiddos School'
                }
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const pw = doc.page.width;  // ~595.28
            const ph = doc.page.height; // ~841.89
            const m = PAGE_TOP;
            const cw = pw - m * 2;      // ~523.28
            let y = m;

            // // // // // // // // // // // // // // // // // // // //
            // 1. ORANGE HEADER — simple, clean, no cramped side-by-side text
            //    Logo on left, school name + address stacked on right
            // // // // // // // // // // // // // // // // // // // //
            const headerH = 82;
            doc.rect(m, y, cw, headerH).fill(ORANGE);

            const logoSize = 62;
            const logoX = m + 12;
            const logoY = y + (headerH - logoSize) / 2;
            doc.roundedRect(logoX, logoY, logoSize, logoSize, 6).fill('#FFFFFF');
            if (logoBuffer) {
                try {
                    doc.image(logoBuffer, logoX + 3, logoY + 3, { width: logoSize - 6, height: logoSize - 6 });
                } catch (e) {
                    doc.fillColor(NAVY).fontSize(14).font('Helvetica-Bold')
                        .text('AKS', logoX, logoY + 18, { align: 'center', width: logoSize });
                }
            } else {
                doc.fillColor(NAVY).fontSize(14).font('Helvetica-Bold')
                    .text('AKS', logoX, logoY + 18, { align: 'center', width: logoSize });
            }

            // School name + address next to logo (no right-side meta to compete)
            const hCenterX = logoX + logoSize + 14;
            doc.fillColor(NAVY)
                .fontSize(18).font('Helvetica-Bold')
                .text('ANEJA KIDDOS SCHOOL', hCenterX, y + 12, { width: cw - hCenterX + m });
            doc.fillColor('#FFFFFF')
                .fontSize(12).font('Helvetica')
                .text('Ansal Town, Sector-19, Rewari', hCenterX, y + 36, { width: cw - hCenterX + m });
            doc.fillColor('#111827')
                .fontSize(11).font('Helvetica-Bold')
                .text('TEST RESULT', hCenterX, y + 56, { width: cw - hCenterX + m });

            y += headerH + 10;

            // // // // // // // // // // // // // // // // // // // //
            // 2. TEST INFO STRIP — clean white row with all test details
            //    No overlap risk because each item is spaced out on its own line
            // // // // // // // // // // // // // // // // // // // //
            const infoH = 56;
            doc.roundedRect(m, y, cw, infoH, 4).fill(CARD_BG);
            doc.roundedRect(m, y, cw, infoH, 4).lineWidth(0.5).stroke(BORDER);

            // Spaced horizontally: Subject | Grade | Marks | Date
            const infoParts = [
                { label: 'Subject', value: subjectName, w: 180 },
                { label: 'Grade', value: gradeLevel, w: 80 },
                { label: 'Marks', value: `${totalMarks}`, w: 80 },
                { label: 'Date', value: dateStr, w: 140 },
            ];
            let ix = m + 14;
            const iy = y + 8;
            infoParts.forEach((p) => {
                doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold').text(p.label, ix, iy, { width: p.w });
                doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold').text(p.value, ix, iy + 14, { width: p.w });
                ix += p.w;
            });

            // Test name on second line of the strip
            doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold').text('Test', m + 14, iy + 32, { width: 50 });
            doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text(testName, m + 14 + 50, iy + 32, { width: cw - 70 });

            y += infoH + 14;

            // // // // // // // // // // // // // // // // // // // //
            // 2. STUDENT INFO CARD — exactly like .student-card
            //    Flex layout: [photo left] [profile-grid right]
            //    FIX: Increased rowHeight to 30 to prevent text wrapping overlap
            // // // // // // // // // // // // // // // // // // // //
            const photoW = 88;
            const photoH = 110;
            const cardPad = 12;
            const profileRows = 4;
            const rowHeight = 30; // Increased from 23 to prevent 2-line text overlap
            const cardH = cardPad * 2 + profileRows * rowHeight;

            doc.roundedRect(m, y, cw, cardH, 8)
                .fillAndStroke(CARD_BG, BORDER);

            // --- LEFT: Photo area ---
            const photoX = m + cardPad;
            const photoY2 = y + (cardH - photoH) / 2;
            doc.rect(photoX, photoY2, photoW, photoH)
                .fillAndStroke('#FFFFFF', BORDER);
            if (logoBuffer) {
                try {
                    doc.image(logoBuffer, photoX + 8, photoY2 + 15, { width: photoW - 16, height: photoH - 30 });
                } catch (e) {
                    doc.fillColor('#e5e7eb').fontSize(10).font('Helvetica')
                        .text('PHOTO', photoX, photoY2 + 48, { align: 'center', width: photoW });
                }
            } else {
                doc.fillColor('#e5e7eb').fontSize(10).font('Helvetica')
                    .text('PHOTO', photoX, photoY2 + 48, { align: 'center', width: photoW });
            }

            // --- RIGHT: 2-column profile grid ---
            const rightEdge = m + cw - cardPad;
            const gridX = photoX + photoW + 14;
            const gridW = rightEdge - gridX;
            const colMid = gridX + gridW / 2;
            const gap = 8;
            const col1X = gridX;
            const col2X = colMid + gap;
            const labelW = 74;  // Reduced from 82 to give more room for values
            const valW = (gridW / 2) - gap - labelW - 4;

            // Format DOB nicely
            let dobStr = 'N/A';
            if (dateOfBirth) {
                try {
                    dobStr = new Date(dateOfBirth).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'long', year: 'numeric'
                    });
                } catch (e) { dobStr = String(dateOfBirth); }
            }

            const profileFields = [
                { label: "Student's Name", value: fullName, col: 1 },
                { label: 'Class / Section', value: section ? `${gradeLevel} - ${section}` : gradeLevel, col: 2 },
                { label: "Father's Name", value: parentName || 'N/A', col: 1 },
                { label: 'Roll Number', value: rollNumber || 'N/A', col: 2 },
                { label: "Mother's Name", value: motherName || 'N/A', col: 1 },
                { label: 'Student ID', value: studentId || 'N/A', col: 2 },
                { label: 'Gender', value: gender || 'N/A', col: 1 },
                { label: 'Date of Birth', value: dobStr, col: 2 },
            ];

            profileFields.forEach((f, i) => {
                const fx = f.col === 1 ? col1X : col2X;
                const rowIdx = Math.floor(i / 2);
                const fy = y + cardPad + 2 + rowIdx * rowHeight;

                doc.fillColor(MUTED)
                    .fontSize(8)  // Smaller to prevent wrap
                    .font('Helvetica-Bold')
                    .text(f.label, fx, fy, { width: labelW });

                doc.fillColor(DARK)
                    .fontSize(9)  // Smaller to prevent wrap
                    .font('Helvetica')
                    .text(f.value, fx + labelW, fy, { width: valW });

                // Dashed border-bottom — spans the full column width
                const lineStartX = fx;
                let lineEndX;
                if (f.col === 2) {
                    lineEndX = rightEdge;
                } else {
                    lineEndX = colMid - 4;
                }
                doc.moveTo(lineStartX, fy + 20)
                    .lineTo(lineEndX, fy + 20)
                    .strokeColor('#e5e7eb')
                    .lineWidth(0.5)
                    .stroke();
            });

            y += cardH + 14;

            // // // // // // // // // // // // // // // // // // // //
            // 3. RESULT TABLE — exactly like .rc-table
            //    Header on #f5f9ff, navy text, single row
            // // // // // // // // // // // // // // // // // // // //
            const cols = ['#', 'Subject', 'Scored', 'Max', 'Percentage', 'Grade'];
            const colW = [26, 148, 72, 60, 96, 60];
            const tableLeft = m + 16;
            const tableW = cw - 32;
            const headerRowH = 24;
            const dataRowH = 28;

            // Table header
            let cx = tableLeft;
            doc.rect(cx, y, tableW, headerRowH).fill('#f5f9ff');
            cols.forEach((col, i) => {
                doc.fillColor(NAVY)
                    .fontSize(9.5)
                    .font('Helvetica-Bold')
                    .text(col, cx + (i === 0 ? 8 : 4), y + 6, { width: colW[i], align: i === 0 ? 'center' : 'left' });
                cx += colW[i];
            });

            // Data row
            cx = tableLeft;
            y += headerRowH;
            const pct = totalMarks > 0 ? ((score / totalMarks) * 100) : 0;
            let gradeLetter = 'E';
            if (pct >= 91) gradeLetter = 'A1';
            else if (pct >= 81) gradeLetter = 'A2';
            else if (pct >= 71) gradeLetter = 'B1';
            else if (pct >= 61) gradeLetter = 'B2';
            else if (pct >= 51) gradeLetter = 'C1';
            else if (pct >= 41) gradeLetter = 'C2';
            else if (pct >= 33) gradeLetter = 'D';

            const rowData = ['1', subjectName, String(score), String(totalMarks), `${pct.toFixed(1)}%`, gradeLetter];

            doc.rect(cx, y, tableW, dataRowH).fill('#FFFFFF');
            rowData.forEach((val, i) => {
                doc.fillColor(DARK)
                    .fontSize(10.5)
                    .font(i === 1 || i === 0 ? 'Helvetica-Bold' : 'Helvetica')
                    .text(val, cx + (i === 0 ? 8 : 4), y + 7, { width: colW[i], align: i === 0 ? 'center' : 'left' });
                cx += colW[i];
            });

            // Table border
            doc.rect(tableLeft, y - headerRowH, tableW, headerRowH + dataRowH)
                .lineWidth(0.5)
                .strokeColor(BORDER)
                .stroke();

            // Internal vertical lines
            let lcx = tableLeft;
            colW.forEach((w, i) => {
                if (i < colW.length - 1) {
                    lcx += w;
                    doc.moveTo(lcx, y - headerRowH).lineTo(lcx, y + dataRowH)
                        .lineWidth(0.5).strokeColor(BORDER).stroke();
                }
            });

            y += dataRowH + 14;

            // // // // // // // // // // // // // // // // // // // //
            // 4. SCORE SUMMARY — navy (#0b3b78) rounded box
            // // // // // // // // // // // // // // // // // // // //
            const boxW = 380;
            const boxX = (pw - boxW) / 2;
            const boxH = 46;

            doc.roundedRect(boxX, y, boxW, boxH, 8).fill(NAVY);
            doc.fillColor('#FFFFFF')
                .fontSize(13)
                .font('Helvetica-Bold')
                .text(
                    `Score: ${score} / ${totalMarks}    |    ${pct.toFixed(1)}%    |    Grade: ${gradeLetter}`,
                    boxX, y + 14,
                    { align: 'center', width: boxW }
                );

            y += boxH + 24;

            // // // // // // // // // // // // // // // // // // // //
            // 5. SIGNATURES — 4 columns: Class Teacher, Principal, Director, Parent
            //    Shows actual names below the dashed line
            // // // // // // // // // // // // // // // // // // // //
            const sigY = ph - 105;
            const nCols = 4;
            const colW_sig = cw / nCols;

            const sigItems = [
                { title: 'Class Teacher', name: teacherName || '________________' },
                { title: 'Principal', name: 'Nidhi Dhamija' },
                { title: 'Director', name: 'Param Aneja' },
                { title: "Parent's Sign.", name: '' },
            ];

            sigItems.forEach((item, i) => {
                const sx = m + i * colW_sig;
                // Dashed line
                for (let dash = 0; dash < 5; dash++) {
                    const dashX = sx + 12 + dash * ((colW_sig - 24) / 5);
                    doc.moveTo(dashX, sigY)
                        .lineTo(dashX + 6, sigY)
                        .strokeColor(BORDER)
                        .lineWidth(0.8)
                        .stroke();
                }

                // Name below the line (if available)
                if (item.name) {
                    doc.fillColor(DARK)
                        .fontSize(9)
                        .font('Helvetica-Bold')
                        .text(item.name, sx, sigY + 4, { align: 'center', width: colW_sig });
                    doc.fillColor(MUTED)
                        .fontSize(7.5)
                        .font('Helvetica')
                        .text(`(${item.title})`, sx, sigY + 16, { align: 'center', width: colW_sig });
                } else {
                    doc.fillColor(MUTED)
                        .fontSize(9)
                        .font('Helvetica-Bold')
                        .text(item.title, sx, sigY + 8, { align: 'center', width: colW_sig });
                }
            });

            // // // // // // // // // // // // // // // // // // // //
            // 6. FOOTER — orange (#ed8544) rounded, exactly like .rc-footer
            // // // // // // // // // // // // // // // // // // // //
            const footerY2 = ph - 66;
            doc.roundedRect(m, footerY2, cw, 32, 8).fill(ORANGE);
            doc.fillColor('#FFFFFF')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(
                    'You leaped and crossed the hindrances & put a flag of victory with great enthusiasm!',
                    m + 10, footerY2 + 6,
                    { align: 'center', width: cw - 20 }
                );
            doc.fontSize(10)
                .font('Helvetica')
                .text('Wishing you a bright and successful future.',
                    m + 10, footerY2 + 20,
                    { align: 'center', width: cw - 20 }
                );

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

// @desc    Generate PDF for a single student and return it
// @route   GET /api/custom-tests/:id/pdf/:studentId
exports.generateStudentPdf = async (req, res) => {
    try {
        const test = await CustomTest.findById(req.params.id).populate('subject', 'name').populate('createdBy', 'fullName');
        if (!test) {
            return res.status(404).json({ message: 'Test not found.' });
        }

        const student = await Student.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const grade = await CustomTestGrade.findOne({
            customTest: test._id,
            student: student._id
        });

        if (!grade) {
            return res.status(404).json({ message: 'No marks found for this student in this test.' });
        }

        const pdfBuffer = await generateTestPdf(
            {
                fullName: student.fullName,
                studentId: student.studentId,
                rollNumber: student.rollNumber,
                gradeLevel: test.gradeLevel,
                section: student.section,
                gender: student.gender,
                dateOfBirth: student.dateOfBirth,
                motherName: student.motherName,
                parentName: student.parentContact?.parentName
            },
            {
                testName: test.name,
                subjectName: test.subject?.name || 'N/A',
                totalMarks: test.totalMarks,
                score: grade.score,
                dateStr: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                teacherName: test.createdBy?.fullName || ''
            }
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${test.name}_${student.fullName}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ message: 'Error generating PDF.' });
    }
};

// ===================== WHATSAPP SEND =====================

// @desc    Send test result PDF to a single parent via WhatsApp
// @route   POST /api/custom-tests/:id/send/:studentId
exports.sendPdfToParent = async (req, res) => {
    try {
        const test = await CustomTest.findById(req.params.id).populate('subject', 'name').populate('createdBy', 'fullName');
        if (!test) {
            return res.status(404).json({ message: 'Test not found.' });
        }

        const student = await Student.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        if (!student.parentContact?.phone) {
            return res.status(400).json({ message: `No parent phone number for ${student.fullName}.` });
        }

        const grade = await CustomTestGrade.findOne({
            customTest: test._id,
            student: student._id
        });

        if (!grade) {
            return res.status(400).json({ message: 'No marks entered for this student yet.' });
        }

        // Generate PDF
        const pdfBuffer = await generateTestPdf(
            {
                fullName: student.fullName,
                studentId: student.studentId,
                rollNumber: student.rollNumber,
                gradeLevel: test.gradeLevel,
                section: student.section,
                gender: student.gender,
                dateOfBirth: student.dateOfBirth,
                motherName: student.motherName,
                parentName: student.parentContact?.parentName
            },
            {
                testName: test.name,
                subjectName: test.subject?.name || 'N/A',
                totalMarks: test.totalMarks,
                score: grade.score,
                dateStr: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                teacherName: test.createdBy?.fullName || ''
            }
        );

        // Send via WhatsApp
        const fileName = `${test.name.replace(/\s+/g, '_')}_${student.fullName.replace(/\s+/g, '_')}.pdf`;
        const caption = `🏫 *ANEJA KIDDOS SCHOOL*\n📝 *${test.name} - Result*\n\n👤 Student: ${student.fullName}\n📚 Subject: ${test.subject?.name || 'N/A'}\n🎯 Score: ${grade.score}/${test.totalMarks}\n📊 Class: ${test.gradeLevel}\n\n_Thank you,_\n_Aneja Kiddos School_\n_Ansal Town, Sector-19, Rewari_`;

        try {
            await sendWhatsAppDocument(student.parentContact.phone, pdfBuffer, fileName, caption);
            res.json({ success: true, message: `PDF sent to parent of ${student.fullName}.` });
        } catch (waError) {
            console.error('WhatsApp send error:', waError);
            res.status(500).json({ message: `WhatsApp send failed: ${waError.message}` });
        }
    } catch (error) {
        console.error('Send PDF error:', error);
        res.status(500).json({ message: 'Error sending PDF.' });
    }
};

// @desc    Send test result PDFs to SELECTED parents via WhatsApp
// @route   POST /api/custom-tests/:id/send-selected
exports.sendPdfToSelectedParents = async (req, res) => {
    try {
        const { studentIds } = req.body;
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of student IDs.' });
        }

        const test = await CustomTest.findById(req.params.id).populate('subject', 'name').populate('createdBy', 'fullName');
        if (!test) {
            return res.status(404).json({ message: 'Test not found.' });
        }

        // Get grades only for selected students
        const grades = await CustomTestGrade.find({ 
            customTest: test._id,
            student: { $in: studentIds }
        });

        if (grades.length === 0) {
            return res.status(400).json({ message: 'No marks found for selected students.' });
        }

        const students = await Student.find({ _id: { $in: studentIds } });
        const studentMap = {};
        students.forEach(s => { studentMap[s._id.toString()] = s; });

        const results = { sent: 0, failed: 0, errors: [] };

        const tasks = grades.map((grade) => async () => {
            const student = studentMap[grade.student.toString()];
            if (!student || !student.parentContact?.phone) {
                results.failed++;
                if (student) results.errors.push(`${student.fullName}: No phone number`);
                return;
            }

            const pdfBuffer = await generateTestPdf(
                {
                    fullName: student.fullName,
                    studentId: student.studentId,
                    rollNumber: student.rollNumber,
                    gradeLevel: test.gradeLevel,
                    section: student.section,
                    gender: student.gender,
                    dateOfBirth: student.dateOfBirth,
                    motherName: student.motherName,
                    parentName: student.parentContact?.parentName
                },
                {
                    testName: test.name,
                    subjectName: test.subject?.name || 'N/A',
                    totalMarks: test.totalMarks,
                    score: grade.score,
                    dateStr: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                    teacherName: test.createdBy?.fullName || ''
                }
            );

            const fileName = `${test.name.replace(/\s+/g, '_')}_${student.fullName.replace(/\s+/g, '_')}.pdf`;
            const caption = `🏫 *ANEJA KIDDOS SCHOOL*\n📝 *${test.name} - Result*\n\n👤 Student: ${student.fullName}\n📚 Subject: ${test.subject?.name || 'N/A'}\n🎯 Score: ${grade.score}/${test.totalMarks}\n📊 Class: ${test.gradeLevel}\n\n_Thank you,_\n_Aneja Kiddos School_\n_Ansal Town, Sector-19, Rewari_`;

            await sendWhatsAppDocument(student.parentContact.phone, pdfBuffer, fileName, caption);
            results.sent++;
        });

        await runWithConcurrency(tasks, 5);

        res.json({
            success: true,
            message: `Sent to ${results.sent} parents. ${results.failed} failed.`,
            details: results
        });
    } catch (error) {
        console.error('Send selected PDFs error:', error);
        res.status(500).json({ message: 'Error sending PDFs to selected parents.' });
    }
};

// @desc    Send test result PDFs to ALL parents via WhatsApp
// @route   POST /api/custom-tests/:id/send-all
exports.sendPdfToAllParents = async (req, res) => {
    try {
        const test = await CustomTest.findById(req.params.id).populate('subject', 'name').populate('createdBy', 'fullName');
        if (!test) {
            return res.status(404).json({ message: 'Test not found.' });
        }

        // Get all grades for this test
        const grades = await CustomTestGrade.find({ customTest: test._id });
        if (grades.length === 0) {
            return res.status(400).json({ message: 'No marks found. Please enter marks first.' });
        }

        // Get student IDs
        const studentIds = grades.map(g => g.student);
        const students = await Student.find({ _id: { $in: studentIds } });

        // Create a map for quick lookup
        const studentMap = {};
        students.forEach(s => {
            studentMap[s._id.toString()] = s;
        });

        const results = { sent: 0, failed: 0, errors: [] };

        // Build tasks array for concurrency
        const tasks = grades.map((grade) => async () => {
            const student = studentMap[grade.student.toString()];
            if (!student) {
                results.failed++;
                return;
            }

            if (!student.parentContact?.phone) {
                results.failed++;
                results.errors.push(`${student.fullName}: No phone number`);
                return;
            }

            const pdfBuffer = await generateTestPdf(
                {
                    fullName: student.fullName,
                    studentId: student.studentId,
                    rollNumber: student.rollNumber,
                    gradeLevel: test.gradeLevel,
                    section: student.section,
                    gender: student.gender,
                    dateOfBirth: student.dateOfBirth,
                    motherName: student.motherName,
                    parentName: student.parentContact?.parentName
                },
                {
                    testName: test.name,
                    subjectName: test.subject?.name || 'N/A',
                    totalMarks: test.totalMarks,
                    score: grade.score,
                    dateStr: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
                    teacherName: test.createdBy?.fullName || ''
                }
            );

            const fileName = `${test.name.replace(/\s+/g, '_')}_${student.fullName.replace(/\s+/g, '_')}.pdf`;
            const caption = `🏫 *ANEJA KIDDOS SCHOOL*\n📝 *${test.name} - Result*\n\n👤 Student: ${student.fullName}\n📚 Subject: ${test.subject?.name || 'N/A'}\n🎯 Score: ${grade.score}/${test.totalMarks}\n📊 Class: ${test.gradeLevel}\n\n_Thank you,_\n_Aneja Kiddos School_\n_Ansal Town, Sector-19, Rewari_`;

            await sendWhatsAppDocument(student.parentContact.phone, pdfBuffer, fileName, caption);
            results.sent++;
        });

        // Run with concurrency limit of 5 to avoid overwhelming the system
        await runWithConcurrency(tasks, 5);

        res.json({
            success: true,
            message: `Sent to ${results.sent} parents. ${results.failed} failed.`,
            details: results
        });
    } catch (error) {
        console.error('Send all PDFs error:', error);
        res.status(500).json({ message: 'Error sending PDFs to parents.' });
    }
};
