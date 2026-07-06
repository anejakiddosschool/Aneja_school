// server/controllers/classController.js
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Section = require('../models/Section');

// @desc    Get all unique grade levels (from both Subjects and Students)
// @route   GET /api/classes/grades
exports.getAllGrades = async (req, res) => {
  try {
    const [subjectGrades, studentGrades] = await Promise.all([
      Subject.distinct('gradeLevel'),
      Student.distinct('gradeLevel')
    ]);

    // Merge and deduplicate
    const allGrades = [...new Set([...subjectGrades, ...studentGrades].filter(Boolean))];
    
    // Sort naturally (e.g., "1", "2", ..., "10", "11", "12")
    allGrades.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a).localeCompare(String(b));
    });

    res.json({ success: true, count: allGrades.length, data: allGrades });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all unique sections (from Section model + Students)
// @route   GET /api/classes/sections
exports.getAllSections = async (req, res) => {
  try {
    const { gradeLevel } = req.query;
    const filter = gradeLevel ? { gradeLevel } : {};
    
    // Get sections from both the Section model AND from existing students
    const [managedSections, studentSections] = await Promise.all([
      Section.find(filter).sort({ name: 1 }).lean(),
      Student.distinct('section', filter)
    ]);
    
    // Merge managed section names with student section names
    const managedNames = managedSections.map(s => s.name).filter(Boolean);
    const studentNames = studentSections.filter(Boolean);
    
    // Return unique sorted sections with IDs for managed ones
    const allUniqueNames = [...new Set([...managedNames, ...studentNames])].sort();
    
    // Return as objects with id, name for managed sections
    const result = allUniqueNames.map(name => {
      const managed = managedSections.find(s => s.name === name);
      return {
        _id: managed?._id || null,
        name,
        isManaged: !!managed
      };
    });
    
    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new grade level (just validates it exists or can be created)
// @route   POST /api/classes/grades
exports.createGrade = async (req, res) => {
  try {
    const { gradeLevel } = req.body;
    
    if (!gradeLevel || !gradeLevel.trim()) {
      return res.status(400).json({ success: false, message: 'Grade level is required.' });
    }

    const trimmedGrade = gradeLevel.trim();

    // Check if this grade already has subjects or students
    const [existingSubject, existingStudent] = await Promise.all([
      Subject.findOne({ gradeLevel: trimmedGrade }),
      Student.findOne({ gradeLevel: trimmedGrade })
    ]);

    if (existingSubject || existingStudent) {
      return res.json({ 
        success: true, 
        message: `Grade "${trimmedGrade}" already exists in the system.`,
        gradeLevel: trimmedGrade
      });
    }

    // Create a placeholder subject to register this grade level
    // This ensures the grade appears in dropdowns even without students
    await Subject.create({
      name: `Grade ${trimmedGrade} - General`,
      gradeLevel: trimmedGrade,
      code: `GEN-${trimmedGrade}`
    });

    res.status(201).json({ 
      success: true, 
      message: `Grade "${trimmedGrade}" created successfully!`,
      gradeLevel: trimmedGrade 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ 
        success: true, 
        message: 'This grade already exists.',
        gradeLevel: req.body.gradeLevel?.trim()
      });
    }
    console.error('Error creating grade:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new section for a grade level
// @route   POST /api/classes/sections
exports.createSection = async (req, res) => {
  try {
    const { gradeLevel, name } = req.body;
    
    if (!gradeLevel || !gradeLevel.trim() || !name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Grade level and section name are required.' 
      });
    }

    const trimmedGrade = gradeLevel.trim();
    const trimmedName = name.trim().toUpperCase();

    const existing = await Section.findOne({ gradeLevel: trimmedGrade, name: trimmedName });
    if (existing) {
      return res.json({ 
        success: true, 
        message: `Section "${trimmedName}" already exists for Class ${trimmedGrade}.`,
        section: existing
      });
    }

    const section = await Section.create({
      gradeLevel: trimmedGrade,
      name: trimmedName
    });

    res.status(201).json({ 
      success: true, 
      message: `Section "${trimmedName}" created for Class ${trimmedGrade}!`,
      section
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ 
        success: true, 
        message: 'This section already exists.',
        section: { gradeLevel: req.body.gradeLevel, name: req.body.name }
      });
    }
    console.error('Error creating section:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a section
// @route   DELETE /api/classes/sections/:id
exports.deleteSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    // Check if students still use this section for this grade
    const studentCount = await Student.countDocuments({ 
      gradeLevel: section.gradeLevel, 
      section: section.name 
    });

    await Section.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: studentCount > 0 
        ? `Section "${section.name}" removed. Note: ${studentCount} student(s) still have this section assigned.`
        : `Section "${section.name}" removed.`,
      studentCount
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a grade level and all its associated data
// @route   DELETE /api/classes/grades/:gradeLevel
exports.deleteGrade = async (req, res) => {
  try {
    const { gradeLevel } = req.params;
    
    if (!gradeLevel) {
      return res.status(400).json({ success: false, message: 'Grade level is required.' });
    }

    // SAFETY CHECK: Don't delete if students still belong to this grade
    const studentCount = await Student.countDocuments({ gradeLevel });
    if (studentCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete "${gradeLevel}" because ${studentCount} student(s) are still enrolled in this class. Please promote/remove them first.`,
        studentCount
      });
    }

    // Delete all subjects AND sections for this grade
    const [subjectResult, sectionResult] = await Promise.all([
      Subject.deleteMany({ gradeLevel }),
      Section.deleteMany({ gradeLevel })
    ]);
    
    res.json({ 
      success: true, 
      message: `Grade "${gradeLevel}" removed. ${subjectResult.deletedCount} subject(s) and ${sectionResult.deletedCount} section(s) deleted.`,
      deletedSubjects: subjectResult.deletedCount,
      deletedSections: sectionResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
