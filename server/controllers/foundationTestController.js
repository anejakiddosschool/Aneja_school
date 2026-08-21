const FoundationTest = require('../models/FoundationTest');
const CustomTest = require('../models/CustomTest');
const CustomTestGrade = require('../models/CustomTestGrade');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { sendWhatsAppDocument } = require('../whatsappClient');
const PDFDocument = require('pdfkit');
const https = require('https');

// Helper: run tasks with concurrency limit
async function runWithConcurrency(tasks, limit = 5) {
    const results = [];
    const iter = tasks.entries();
    async function worker() {
        for (const [i, task] of iter) {
            try { results[i] = await task(); } catch (e) { results[i] = e; }
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
    return results;
}

// ===================== CREATE =====================
exports.createFoundationTest = async (req, res) => {
    try {
        const { name, gradeLevel, subjects, semester, academicYear } = req.body;
        // subjects: [{ subjectId, marks }]

        if (!name || !gradeLevel || !subjects || subjects.length < 2) {
            return res.status(400).json({ message: 'Name, class, and at least 2 subjects are required.' });
        }

        const totalMarks = subjects.reduce((sum, s) => sum + Number(s.marks), 0);

        const ft = await FoundationTest.create({
            name: name.trim(),
            gradeLevel,
            subjects: subjects.map(s => ({ subject: s.subjectId, marks: Number(s.marks) })),
            totalMarks,
            createdBy: req.user._id,
            semester: semester || 'First Semester',
            academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        });

        // Auto-create individual CustomTests for each subject
        for (const s of subjects) {
            const subj = await Subject.findById(s.subjectId);
            await CustomTest.create({
                name: `${name.trim()} - ${subj?.name || 'Subject'}`,
                subject: s.subjectId,
                gradeLevel,
                totalMarks: Number(s.marks),
                createdBy: req.user._id,
                semester: ft.semester,
                academicYear: ft.academicYear,
                foundationGroup: ft._id.toString()
            });
        }

        res.status(201).json({ success: true, data: ft });
    } catch (err) {
        console.error('Create foundation test error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ===================== LIST =====================
exports.getFoundationTests = async (req, res) => {
    try {
        const filter = {};
        if (req.query.gradeLevel) filter.gradeLevel = req.query.gradeLevel;

        const tests = await FoundationTest.find(filter)
            .populate('subjects.subject', 'name gradeLevel')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });

        if (tests.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Bulk fetch: collect all foundationGroup IDs
        const groupIds = tests.map(t => t._id.toString());

        // 1 query: get ALL customTests for ALL foundation tests at once
        const allCustomTests = await CustomTest.find({ foundationGroup: { $in: groupIds } }).select('_id foundationGroup').lean();

        // Build a map: foundationGroup -> [customTestIds]
        const ctByGroup = {};
        allCustomTests.forEach(ct => {
            if (!ctByGroup[ct.foundationGroup]) ctByGroup[ct.foundationGroup] = [];
            ctByGroup[ct.foundationGroup].push(ct._id);
        });

        // Collect all customTest IDs for grade count
        const allCtIds = allCustomTests.map(ct => ct._id);

        // 1 query: get grade counts for ALL custom tests at once
        let gradeCounts = {};
        if (allCtIds.length > 0) {
            const counts = await CustomTestGrade.aggregate([
                { $match: { customTest: { $in: allCtIds } } },
                { $group: { _id: '$customTest', count: { $sum: 1 } } }
            ]);
            counts.forEach(c => { gradeCounts[c._id.toString()] = c.count; });
        }

        const result = tests.map(t => {
            const gid = t._id.toString();
            const cts = ctByGroup[gid] || [];
            let completed = 0;
            for (const ctId of cts) {
                if (gradeCounts[ctId.toString()] > 0) completed++;
            }
            return {
                ...t.toObject(),
                completedSubjects: completed,
                totalSubjects: cts.length,
                status: completed === cts.length && cts.length > 0 ? 'complete' : 'pending'
            };
        });

        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Get foundation tests error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ===================== DETAIL =====================
exports.getFoundationTestById = async (req, res) => {
    try {
        const ft = await FoundationTest.findById(req.params.id)
            .populate('subjects.subject', 'name gradeLevel')
            .populate('createdBy', 'fullName');

        if (!ft) return res.status(404).json({ message: 'Not found.' });

        // 1 query: get all customTests for this foundation test
        const customTests = await CustomTest.find({ foundationGroup: ft._id.toString() })
            .populate('subject', 'name gradeLevel');

        const ctIds = customTests.map(ct => ct._id);
        const studentIds = [];
        let students = [];

        // 1 query: get all students for this grade level
        if (ft.gradeLevel) {
            students = await Student.find({ gradeLevel: ft.gradeLevel, status: 'Active' })
                .sort({ fullName: 1 })
                .select('fullName studentId parentContact rollNumber');
            students.forEach(st => studentIds.push(st._id));
        }

        // Build subject status (count grades in bulk)
        let gradeCountsMap = {};
        if (ctIds.length > 0) {
            const counts = await CustomTestGrade.aggregate([
                { $match: { customTest: { $in: ctIds } } },
                { $group: { _id: '$customTest', count: { $sum: 1 } } }
            ]);
            counts.forEach(c => { gradeCountsMap[c._id.toString()] = c.count; });
        }

        const subjectStatus = [];
        let completed = 0;
        for (const sub of ft.subjects) {
            const ct = customTests.find(c => c.subject?._id?.toString() === sub.subject._id.toString());
            const hasMarks = ct ? (gradeCountsMap[ct._id.toString()] || 0) > 0 : false;
            if (hasMarks) completed++;
            subjectStatus.push({
                subjectId: sub.subject._id,
                subjectName: sub.subject.name,
                totalMarks: sub.marks,
                hasMarks,
                customTestId: ct?._id || null
            });
        }

        // 1 query: get ALL grades for ALL customTests at once (instead of students × subjects queries)
        let allGrades = [];
        if (ctIds.length > 0 && studentIds.length > 0) {
            allGrades = await CustomTestGrade.find({
                customTest: { $in: ctIds },
                student: { $in: studentIds }
            }).select('customTest student score').lean();
        }

        // Build lookup map: `customTestId_studentId` -> score
        const gradeMap = {};
        allGrades.forEach(g => {
            gradeMap[`${g.customTest}_${g.student}`] = g.score;
        });

        const studentData = students.map(st => {
            const subScores = {};
            let totalScored = 0;
            for (const ss of subjectStatus) {
                if (ss.customTestId) {
                    const key = `${ss.customTestId}_${st._id}`;
                    const score = gradeMap[key];
                    subScores[ss.subjectId.toString()] = score !== undefined ? score : null;
                    if (score !== undefined) totalScored += score;
                } else {
                    subScores[ss.subjectId.toString()] = null;
                }
            }
            return { ...st.toObject(), subScores, totalScored };
        });

        res.json({
            success: true,
            data: {
                ...ft.toObject(),
                subjectStatus,
                students: studentData,
                completedSubjects: completed,
                totalSubjects: ft.subjects.length,
                status: completed === ft.subjects.length ? 'complete' : 'pending'
            }
        });
    } catch (err) {
        console.error('Get foundation test error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ===================== DELETE =====================
exports.deleteFoundationTest = async (req, res) => {
    try {
        const ft = await FoundationTest.findById(req.params.id);
        if (!ft) return res.status(404).json({ message: 'Not found.' });

        const customTests = await CustomTest.find({ foundationGroup: ft._id.toString() });
        for (const ct of customTests) {
            await CustomTestGrade.deleteMany({ customTest: ct._id });
            await ct.deleteOne();
        }
        await ft.deleteOne();

        res.json({ success: true, message: 'Deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ===================== STUDENTS (for entering marks on a subject) =====================
exports.getFoundationTestStudents = async (req, res) => {
    try {
        const { subjectId } = req.query;
        const ft = await FoundationTest.findById(req.params.id);
        if (!ft) return res.status(404).json({ message: 'Not found.' });

        const students = await Student.find({ gradeLevel: ft.gradeLevel, status: 'Active' })
            .sort({ fullName: 1 })
            .select('fullName studentId parentContact rollNumber');

        if (subjectId) {
            const ct = await CustomTest.findOne({ foundationGroup: ft._id.toString(), subject: subjectId });
            if (!ct) return res.status(404).json({ message: 'Subject test not found.' });

            const grades = await CustomTestGrade.find({ customTest: ct._id });
            const gradeMap = {};
            grades.forEach(g => { gradeMap[g.student.toString()] = g.score; });

            return res.json({
                success: true,
                totalMarks: ct.totalMarks,
                data: students.map(s => ({
                    _id: s._id,
                    fullName: s.fullName,
                    studentId: s.studentId,
                    rollNumber: s.rollNumber,
                    score: gradeMap[s._id.toString()] !== undefined ? gradeMap[s._id.toString()] : null
                }))
            });
        }

        // No subjectId — return all students with all scores (bulk fetch)
        const customTests = await CustomTest.find({ foundationGroup: ft._id.toString() });
        const ctIds = customTests.map(ct => ct._id);
        const studentIds = students.map(s => s._id);

        // 1 query: get ALL grades at once
        const allGrades = ctIds.length > 0 && studentIds.length > 0
            ? await CustomTestGrade.find({ customTest: { $in: ctIds }, student: { $in: studentIds } }).select('customTest student score').lean()
            : [];

        // Build lookup map: `studentId_customTestId` -> score
        const allScores = {};
        allGrades.forEach(g => {
            const sid = g.student.toString();
            if (!allScores[sid]) allScores[sid] = {};
            allScores[sid][g.customTest.toString()] = g.score;
        });

        // Map customTestId -> subjectId for correct keying
        const ctToSubject = {};
        customTests.forEach(ct => { ctToSubject[ct._id.toString()] = ct.subject.toString(); });

        res.json({
            success: true,
            data: students.map(s => {
                const scores = {};
                const sid = s._id.toString();
                if (allScores[sid]) {
                    for (const [ctId, score] of Object.entries(allScores[sid])) {
                        scores[ctToSubject[ctId]] = score;
                    }
                }
                return {
                    _id: s._id,
                    fullName: s.fullName,
                    studentId: s.studentId,
                    rollNumber: s.rollNumber,
                    scores
                };
            })
        });
    } catch (err) {
        console.error('Get foundation students error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ===================== SAVE MARKS for a subject =====================
exports.saveFoundationTestMarks = async (req, res) => {
    try {
        const { subjectId, scores } = req.body;
        if (!subjectId || !scores) return res.status(400).json({ message: 'subjectId and scores required.' });

        const ft = await FoundationTest.findById(req.params.id);
        if (!ft) return res.status(404).json({ message: 'Not found.' });

        const ct = await CustomTest.findOne({ foundationGroup: ft._id.toString(), subject: subjectId });
        if (!ct) return res.status(404).json({ message: 'Subject test not found.' });

        const validScores = [];
        for (const item of scores) {
            if (item.score === '' || item.score === null || item.score === undefined) continue;
            const val = Number(item.score);
            if (val < 0) continue;
            if (val > ct.totalMarks) {
                return res.status(400).json({ message: `Marks for a student cannot exceed ${ct.totalMarks} (max for this subject).` });
            }
            validScores.push({ studentId: item.studentId, val });
        }

        if (validScores.length === 0) {
            return res.json({ success: true, message: 'No marks to save.' });
        }

        // Use bulkWrite for performance (1 query instead of N individual upserts)
        const operations = validScores.map(s => ({
            updateOne: {
                filter: { customTest: ct._id, student: s.studentId },
                update: { $set: { score: s.val, subject: subjectId, gradeLevel: ft.gradeLevel } },
                upsert: true
            }
        }));
        await CustomTestGrade.bulkWrite(operations, { ordered: false });

        res.json({ success: true, message: `Saved ${validScores.length} marks.` });
    } catch (err) {
        console.error('Save foundation marks error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ===================== MERGED PDF =====================
const LOGO_URL = 'https://res.cloudinary.com/dityqhoqp/image/upload/v1757673591/UNMARK_LOGO_copy_1_nonp8j.png';
const NAVY = '#0b3b78', ORANGE = '#ed8544', DARK = '#0f172a', MUTED = '#6b7280', BORDER = '#d1d5db', CARD_BG = '#f8fafc';
const PAGE_TOP = 36;

function fetchImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

function getGrade(pct) {
    if (pct >= 91) return 'A1';
    if (pct >= 81) return 'A2';
    if (pct >= 71) return 'B1';
    if (pct >= 61) return 'B2';
    if (pct >= 51) return 'C1';
    if (pct >= 41) return 'C2';
    if (pct >= 33) return 'D';
    return 'E';
}

const generateMergedPdf = async (studentInfo, testInfo) => {
    const { fullName, studentId, rollNumber, gradeLevel, section } = studentInfo;
    const { testName, subjects, totalMarks, dateStr } = testInfo;

    let logoBuffer;
    try { logoBuffer = await fetchImage(LOGO_URL); } catch (e) { logoBuffer = null; }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 30, bottom: 30, left: 36, right: 36 },
                autoFirstPage: false,
                info: { Title: `${testName} - ${fullName}`, Author: 'Aneja Kiddos School' }
            });
            doc.addPage();
            const buffers = [];
            doc.on('data', c => buffers.push(c));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const pw = doc.page.width;
            const ph = doc.page.height;
            const mL = 36, mR = 36, mT = 30, mB = 30;
            const cw = pw - mL - mR;
            let y = mT;

            // ── Helper: safe text that never creates new pages ──
            const safeText = (txt, x, yy, opts = {}) => {
                doc.save();
                doc.rect(0, 0, pw, ph).clip();
                doc.fillColor(opts.color || DARK)
                    .fontSize(opts.size || 10)
                    .font(opts.font || 'Helvetica')
                    .text(txt, x, yy, { width: opts.w || cw, align: opts.align || 'left', lineBreak: false });
                doc.restore();
            };

            // ═══════════════════════════════════════════
            // 1. HEADER
            // ═══════════════════════════════════════════
            const headerH = 76;
            doc.rect(mL, y, cw, headerH).fill(ORANGE);

            // Logo in white box
            const logoSz = 56;
            const logoX = mL + (headerH - logoSz) / 2;
            const logoY = y + (headerH - logoSz) / 2;
            doc.roundedRect(logoX, logoY, logoSz, logoSz, 6).fill('#FFFFFF');
            if (logoBuffer) {
                try { doc.image(logoBuffer, logoX + 4, logoY + 4, { width: logoSz - 8, height: logoSz - 8 }); } catch (e) {}
            } else {
                safeText('AKS', logoX, logoY + 18, { w: logoSz, align: 'center', color: NAVY, size: 14, font: 'Helvetica-Bold' });
            }

            // Centered text block to the right of logo
            const hdrTxtX = logoX + logoSz + 16;
            const hdrTxtW = cw - (hdrTxtX - mL);
            safeText('ANEJA KIDDOS SCHOOL', hdrTxtX, y + 14, { w: hdrTxtW, color: NAVY, size: 18, font: 'Helvetica-Bold' });
            safeText('Ansal Town, Sector-19, Rewari', hdrTxtX, y + 36, { w: hdrTxtW, color: '#FFFFFF', size: 11, font: 'Helvetica' });
            safeText('FOUNDATION TEST RESULT', hdrTxtX, y + 54, { w: hdrTxtW, color: '#111827', size: 12, font: 'Helvetica-Bold' });
            y += headerH + 8;

            // ═══════════════════════════════════════════
            // 2. INFO STRIP
            // ═══════════════════════════════════════════
            const infoH = 40;
            doc.roundedRect(mL, y, cw, infoH, 4).fillAndStroke(CARD_BG, BORDER);
            const infoItems = [
                { l: 'Test', v: testName, w: 200 },
                { l: 'Class', v: gradeLevel, w: 90 },
                { l: 'Total', v: `${totalMarks}`, w: 70 },
                { l: 'Date', v: dateStr, w: 120 },
            ];
            let ix = mL + 12;
            infoItems.forEach(p => {
                safeText(p.l, ix, y + 6, { size: 7, color: MUTED, font: 'Helvetica-Bold', w: p.w });
                safeText(p.v, ix, y + 19, { size: 10, color: DARK, font: 'Helvetica-Bold', w: p.w });
                ix += p.w;
            });
            y += infoH + 8;

            // ═══════════════════════════════════════════
            // 3. STUDENT INFO CARD
            // ═══════════════════════════════════════════
            const cardH = 44;
            doc.roundedRect(mL, y, cw, cardH, 4).fillAndStroke(CARD_BG, BORDER);
            const col2x = mL + cw / 2 + 10;
            const lblW = 72;
            safeText('Student Name', mL + 12, y + 8, { size: 7, color: MUTED, font: 'Helvetica-Bold', w: lblW });
            safeText(fullName, mL + 12 + lblW, y + 8, { size: 9, color: DARK, w: cw / 2 - lblW - 20 });
            safeText('Class', col2x, y + 8, { size: 7, color: MUTED, font: 'Helvetica-Bold', w: lblW });
            safeText(section ? `${gradeLevel} - ${section}` : gradeLevel, col2x + lblW, y + 8, { size: 9, color: DARK, w: cw / 2 - lblW - 20 });
            safeText('Roll No', mL + 12, y + 24, { size: 7, color: MUTED, font: 'Helvetica-Bold', w: lblW });
            safeText(rollNumber || 'N/A', mL + 12 + lblW, y + 24, { size: 9, color: DARK, w: cw / 2 - lblW - 20 });
            safeText('Student ID', col2x, y + 24, { size: 7, color: MUTED, font: 'Helvetica-Bold', w: lblW });
            safeText(studentId || 'N/A', col2x + lblW, y + 24, { size: 9, color: DARK, w: cw / 2 - lblW - 20 });
            y += cardH + 10;

            // ═══════════════════════════════════════════
            // 4. RESULTS TABLE
            // ═══════════════════════════════════════════
            const tblL = mL + 16;
            const tblW = cw - 32;
            const hdrH = 22;
            const rowH = 24;
            const cols = ['#', 'Subject', 'Scored', 'Max', '%', 'Grade'];
            const colW = [24, 170, 56, 50, 60, 50];

            // Header
            doc.rect(tblL, y, tblW, hdrH).fill(NAVY);
            let cx = tblL;
            cols.forEach((c, i) => {
                safeText(c, cx + 5, y + 6, { size: 8, color: '#FFFFFF', font: 'Helvetica-Bold', w: colW[i] });
                cx += colW[i];
            });
            y += hdrH;

            // Rows
            let totalScored = 0;
            subjects.forEach((s, i) => {
                cx = tblL;
                const pct = s.totalMarks > 0 ? ((s.score / s.totalMarks) * 100) : 0;
                const g = getGrade(pct);
                totalScored += s.score;

                doc.rect(tblL, y, tblW, rowH).fill(i % 2 === 0 ? '#FFFFFF' : '#f8f9fb');
                doc.rect(tblL, y, 2.5, rowH).fill(i % 2 === 0 ? ORANGE : NAVY);

                const vals = [String(i + 1), s.name, String(s.score), String(s.totalMarks), `${pct.toFixed(1)}%`, g];
                vals.forEach((v, j) => {
                    let clr = DARK, fnt = 'Helvetica';
                    if (j === 0) { fnt = 'Helvetica-Bold'; clr = MUTED; }
                    if (j === 1) fnt = 'Helvetica-Bold';
                    if (j === 4) { clr = pct >= 50 ? '#16a34a' : '#dc2626'; fnt = 'Helvetica-Bold'; }
                    if (j === 5) { fnt = 'Helvetica-Bold'; clr = NAVY; }
                    safeText(v, cx + 5, y + 6, { size: 9, color: clr, font: fnt, w: colW[j] });
                    cx += colW[j];
                });
                y += rowH;
            });

            // Total row
            const totalPct = totalMarks > 0 ? ((totalScored / totalMarks) * 100) : 0;
            const tg = getGrade(totalPct);
            doc.rect(tblL, y, tblW, 26).fill(NAVY);
            cx = tblL;
            ['', 'TOTAL', String(totalScored), String(totalMarks), `${totalPct.toFixed(1)}%`, tg].forEach((v, j) => {
                safeText(v, cx + 5, y + 7, { size: 10, color: '#FFFFFF', font: 'Helvetica-Bold', w: colW[j] });
                cx += colW[j];
            });
            y += 32;

            // ═══════════════════════════════════════════
            // 5. SUMMARY BOX — centered
            // ═══════════════════════════════════════════
            const sumW = 300;
            const sumX = (pw - sumW) / 2;
            const sumH = 40;
            doc.roundedRect(sumX, y, sumW, sumH, 8).fill(NAVY);
            safeText(`${totalScored} / ${totalMarks}`, sumX, y + 5, { size: 20, color: ORANGE, font: 'Helvetica-Bold', w: sumW, align: 'center' });
            safeText(`${totalPct.toFixed(1)}%  |  Grade: ${tg}`, sumX, y + 26, { size: 9, color: '#FFFFFF', font: 'Helvetica-Bold', w: sumW, align: 'center' });
            y += sumH + 14;

            // ═══════════════════════════════════════════
            // 6. REMARKS
            // ═══════════════════════════════════════════
            let rmk = '';
            if (totalPct >= 91) rmk = 'Outstanding performance! Keep up the excellent work.';
            else if (totalPct >= 81) rmk = 'Excellent work! Very well done across all subjects.';
            else if (totalPct >= 71) rmk = 'Good performance. Continue working hard to improve further.';
            else if (totalPct >= 61) rmk = 'Satisfactory performance. Focus on weaker subjects.';
            else if (totalPct >= 51) rmk = 'Average performance. More effort needed in studies.';
            else if (totalPct >= 33) rmk = 'Below average. Needs significant improvement and extra attention.';
            else rmk = 'Needs immediate attention and consistent effort to improve.';

            doc.roundedRect(mL, y, cw, 36, 4).fillAndStroke('#f0f9ff', '#bae6fd');
            safeText('REMARKS', mL + 12, y + 5, { size: 7, color: NAVY, font: 'Helvetica-Bold' });
            safeText(rmk, mL + 12, y + 17, { size: 8, color: DARK, w: cw - 24 });
            y += 44;

            // ═══════════════════════════════════════════
            // 7. SIGNATURES (drawn with save/restore, no page break)
            // ═══════════════════════════════════════════
            const sigY = ph - 78;
            ['Class Teacher', 'Principal', 'Director', "Parent's Signature"].forEach((label, i) => {
                const sx = mL + i * (cw / 4);
                const lw = 56;
                const lx = sx + (cw / 4 - lw) / 2;
                doc.save();
                doc.rect(lx, sigY, lw, 0.6).fill(BORDER);
                doc.restore();
                safeText(label, sx, sigY + 4, { size: 7, color: MUTED, w: cw / 4, align: 'center' });
            });

            // ═══════════════════════════════════════════
            // 8. FOOTER (drawn, not text flow)
            // ═══════════════════════════════════════════
            doc.rect(mL, ph - 44, cw, 22).fill(ORANGE);
            safeText('Aneja Kiddos School — Wishing you a bright future!', mL, ph - 38, { size: 8, color: '#FFFFFF', font: 'Helvetica-Bold', w: cw, align: 'center' });

            doc.end();
        } catch (err) { reject(err); }
    });
};

// ===================== SEND MERGED PDF =====================
exports.sendMergedPdf = async (req, res) => {
    try {
        const { studentIds } = req.body; // optional: if empty, send to all
        const ft = await FoundationTest.findById(req.params.id)
            .populate('subjects.subject', 'name')
            .populate('createdBy', 'fullName');
        if (!ft) return res.status(404).json({ message: 'Not found.' });

        // Check completion — bulk aggregation instead of per-subject countDocuments
        const customTests = await CustomTest.find({ foundationGroup: ft._id.toString() }).populate('subject', 'name');
        const ctIds = customTests.map(ct => ct._id);

        if (ctIds.length > 0) {
            const counts = await CustomTestGrade.aggregate([
                { $match: { customTest: { $in: ctIds } } },
                { $group: { _id: '$customTest', count: { $sum: 1 } } }
            ]);
            const countMap = {};
            counts.forEach(c => { countMap[c._id.toString()] = c.count; });
            for (const ct of customTests) {
                if ((countMap[ct._id.toString()] || 0) === 0) {
                    return res.status(400).json({ message: `Marks not entered for subject "${ct.subject?.name || 'Unknown'}".` });
                }
            }
        }

        // Get students
        let studentFilter = { gradeLevel: ft.gradeLevel, status: 'Active' };
        if (studentIds && studentIds.length > 0) {
            studentFilter._id = { $in: studentIds };
        }
        const students = await Student.find(studentFilter);

        // Bulk fetch ALL grades for ALL students at once (instead of per-student-per-subject)
        const studentIdsAll = students.map(st => st._id);
        let allGrades = [];
        if (ctIds.length > 0 && studentIdsAll.length > 0) {
            allGrades = await CustomTestGrade.find({
                customTest: { $in: ctIds },
                student: { $in: studentIdsAll }
            }).select('customTest student score').lean();
        }

        // Build lookup: `customTestId_studentId` -> score
        const gradeLookup = {};
        allGrades.forEach(g => {
            gradeLookup[`${g.customTest}_${g.student}`] = g.score;
        });

        const results = { sent: 0, failed: 0, errors: [] };

        const tasks = students.map(st => async () => {
            if (!st.parentContact?.phone) {
                results.failed++;
                results.errors.push(`${st.fullName}: No phone`);
                return;
            }

            // Gather subject scores from pre-fetched lookup (no DB queries)
            const subjectData = [];
            for (const sub of ft.subjects) {
                const ct = customTests.find(c => c.subject?._id?.toString() === sub.subject._id.toString());
                if (!ct) continue;
                const score = gradeLookup[`${ct._id}_${st._id}`];
                subjectData.push({
                    name: sub.subject.name,
                    score: score !== undefined ? score : 0,
                    totalMarks: sub.marks
                });
            }

            const totalScored = subjectData.reduce((s, d) => s + d.score, 0);
            const pct = ft.totalMarks > 0 ? ((totalScored / ft.totalMarks) * 100).toFixed(1) : 0;

            const pdfBuffer = await generateMergedPdf(
                { fullName: st.fullName, studentId: st.studentId, rollNumber: st.rollNumber, gradeLevel: ft.gradeLevel, section: st.section },
                { testName: ft.name, subjects: subjectData, totalMarks: ft.totalMarks, dateStr: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) }
            );

            const subLines = subjectData.map(s => `📚 ${s.name}: ${s.score}/${s.totalMarks}`).join('\n');
            const fileName = `${ft.name.replace(/\s+/g, '_')}_${st.fullName.replace(/\s+/g, '_')}.pdf`;
            const caption = `🏫 *ANEJA KIDDOS SCHOOL*\n📝 *${ft.name}*\n\n👤 ${st.fullName}\n📊 ${ft.gradeLevel}\n\n${subLines}\n\n🎯 Total: ${totalScored}/${ft.totalMarks} (${pct}%)\n\n_Aneja Kiddos School_`;

            await sendWhatsAppDocument(st.parentContact.phone, pdfBuffer, fileName, caption);
            results.sent++;
        });

        await runWithConcurrency(tasks, 5);
        res.json({ success: true, message: `Sent to ${results.sent}. Failed: ${results.failed}.`, details: results });
    } catch (err) {
        console.error('Send merged PDF error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ===================== DOWNLOAD MERGED PDF =====================
exports.downloadMergedPdf = async (req, res) => {
    try {
        const { studentId } = req.params;
        const ft = await FoundationTest.findById(req.params.id)
            .populate('subjects.subject', 'name')
            .populate('createdBy', 'fullName');
        if (!ft) return res.status(404).json({ message: 'Not found.' });

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        const customTests = await CustomTest.find({ foundationGroup: ft._id.toString() });
        const ctIds = customTests.map(ct => ct._id);

        // Bulk fetch all grades for this student in 1 query
        const allGrades = ctIds.length > 0
            ? await CustomTestGrade.find({ customTest: { $in: ctIds }, student: student._id }).select('customTest score').lean()
            : [];
        const gradeMap = {};
        allGrades.forEach(g => { gradeMap[g.customTest.toString()] = g.score; });

        const subjectData = [];
        for (const sub of ft.subjects) {
            const ct = customTests.find(c => c.subject.toString() === sub.subject._id.toString());
            if (!ct) continue;
            subjectData.push({ name: sub.subject.name, score: gradeMap[ct._id.toString()] || 0, totalMarks: sub.marks });
        }

        const pdfBuffer = await generateMergedPdf(
            { fullName: student.fullName, studentId: student.studentId, rollNumber: student.rollNumber, gradeLevel: ft.gradeLevel, section: student.section },
            { testName: ft.name, subjects: subjectData, totalMarks: ft.totalMarks, dateStr: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) }
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${ft.name}_${student.fullName}.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Download merged PDF error:', err);
        res.status(500).json({ message: 'Error generating PDF.' });
    }
};

// ===================== PREVIEW MERGED PDF (inline view) =====================
exports.previewMergedPdf = async (req, res) => {
    try {
        const { studentId } = req.params;
        const ft = await FoundationTest.findById(req.params.id)
            .populate('subjects.subject', 'name')
            .populate('createdBy', 'fullName');
        if (!ft) return res.status(404).json({ message: 'Not found.' });

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        const customTests = await CustomTest.find({ foundationGroup: ft._id.toString() });
        const ctIds = customTests.map(ct => ct._id);

        // Bulk fetch all grades for this student in 1 query
        const allGrades = ctIds.length > 0
            ? await CustomTestGrade.find({ customTest: { $in: ctIds }, student: student._id }).select('customTest score').lean()
            : [];
        const gradeMap = {};
        allGrades.forEach(g => { gradeMap[g.customTest.toString()] = g.score; });

        const subjectData = [];
        for (const sub of ft.subjects) {
            const ct = customTests.find(c => c.subject.toString() === sub.subject._id.toString());
            if (!ct) continue;
            subjectData.push({ name: sub.subject.name, score: gradeMap[ct._id.toString()] || 0, totalMarks: sub.marks });
        }

        const pdfBuffer = await generateMergedPdf(
            { fullName: student.fullName, studentId: student.studentId, rollNumber: student.rollNumber, gradeLevel: ft.gradeLevel, section: student.section },
            { testName: ft.name, subjects: subjectData, totalMarks: ft.totalMarks, dateStr: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) }
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Preview merged PDF error:', err);
        res.status(500).json({ message: 'Error generating PDF preview.' });
    }
};

// ===================== PREVIEW ALL (preview for all students in tab) =====================
exports.previewAllPdf = async (req, res) => {
    try {
        const ft = await FoundationTest.findById(req.params.id)
            .populate('subjects.subject', 'name')
            .populate('createdBy', 'fullName');
        if (!ft) return res.status(404).json({ message: 'Not found.' });

        const students = await Student.find({ gradeLevel: ft.gradeLevel, status: 'Active' })
            .sort({ fullName: 1 });

        if (students.length === 0) return res.status(404).json({ message: 'No students found.' });

        // Pick first student that has marks — bulk fetch all grades at once
        let targetStudent = students[0];
        const customTests = await CustomTest.find({ foundationGroup: ft._id.toString() });
        const allCtIds = customTests.map(ct => ct._id);
        const allStIds = students.map(st => st._id);

        // 1 query: get ALL grades for ALL students × ALL customTests
        let allGrades = [];
        if (allCtIds.length > 0 && allStIds.length > 0) {
            allGrades = await CustomTestGrade.find({
                customTest: { $in: allCtIds },
                student: { $in: allStIds }
            }).select('customTest student score').lean();
        }

        // Build lookup and find first student with marks
        const gradeLookup = {};
        const studentHasMarks = {};
        allGrades.forEach(g => {
            const sid = g.student.toString();
            const ctid = g.customTest.toString();
            gradeLookup[`${ctid}_${sid}`] = g.score;
            studentHasMarks[sid] = true;
        });
        for (const st of students) {
            if (studentHasMarks[st._id.toString()]) {
                targetStudent = st;
                break;
            }
        }

        const subjectData = [];
        for (const sub of ft.subjects) {
            const ct = customTests.find(c => c.subject.toString() === sub.subject._id.toString());
            if (!ct) continue;
            const score = gradeLookup[`${ct._id}_${targetStudent._id}`];
            subjectData.push({ name: sub.subject.name, score: score !== undefined ? score : 0, totalMarks: sub.marks });
        }

        const pdfBuffer = await generateMergedPdf(
            { fullName: targetStudent.fullName, studentId: targetStudent.studentId, rollNumber: targetStudent.rollNumber, gradeLevel: ft.gradeLevel, section: targetStudent.section },
            { testName: ft.name, subjects: subjectData, totalMarks: ft.totalMarks, dateStr: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) }
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Preview all PDF error:', err);
        res.status(500).json({ message: 'Error generating PDF preview.' });
    }
};
