const asyncHandler = require('express-async-handler');
const ArchivedFeedback = require('../models/ArchivedFeedback');
// At the top of your controller file
const XLSX = require('xlsx');


// @desc Get all archived feedbacks with pagination
// @route GET /api/archived-feedback?page=&limit=&semester=
// @access Admin only
const  getArchivedFeedback = asyncHandler(async (req, res) => {
    try {
        const { semester } = req.query;
        const filter = semester ? { semester } : {};
        let { page, limit } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 20; // Changed default limit to 20
        const skip = (page - 1) * limit;

        const archivedFeedback = await ArchivedFeedback.find(filter)
            .populate('course', 'name code')
            .populate('student', 'name rollNo')
            .populate('professor', 'name')
            .skip(skip)
            .limit(limit);

        const total = await ArchivedFeedback.countDocuments(filter);
        res.json({ archivedFeedback, total, page, limit });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});




// @desc Get archived feedback status
// @route GET /api/archived-feedback/status
// @access Admin only
const getArchivedFeedbackStatus = asyncHandler(async (req, res) => {
    try {
        const totalArchivedFeedback = await ArchivedFeedback.countDocuments();
        res.json({ totalArchivedFeedback });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});



const downloadArchivedFeedback = asyncHandler(async (req, res) => {
    try {
      const { semester } = req.query;
      const filter = semester ? { semester } : {};
  
      // Retrieve all matching records (without pagination)
      const archivedFeedback = await ArchivedFeedback.find(filter)
        .populate('course', 'name code')
        .populate('student', 'name rollNo')
        .populate('professor', 'name');
  
      console.log("Number of archived feedback records:", archivedFeedback.length);
  
      // Prepare data for the XLSX sheet
      const data = archivedFeedback.map(feedback => ({
        "Course Name": feedback.course ? feedback.course.name : "",
        "Course Code": feedback.course ? feedback.course.code : "",
        "Student Name": feedback.student ? feedback.student.name : "",
        "Student RollNo": feedback.student ? feedback.student.rollNo : "",
        "Professor Name": feedback.professor ? feedback.professor.name : "",
        "Overall Grade": feedback.overallGrade || "",
        "Nominated For Best TA": feedback.nominatedForBestTA ? "Yes" : "No",
        "Comments": feedback.comments || "",
        "Semester": feedback.semester || "",
        "Archived Date": new Date(feedback.archivedDate).toLocaleString()
      }));
  
      // Create a worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ArchivedFeedback");
  
      // Write workbook as a Buffer directly
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  
      // Set response headers and send the file
      res.setHeader('Content-Disposition', 'attachment; filename="archivedFeedback.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error("Error generating XLSX:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

  // @desc Get all unique semesters from archived feedback
// @route GET /api/archived-feedback/semesters
// @access Admin only
const getUniqueSemesters = asyncHandler(async (req, res) => {
    try {
      const semesters = await ArchivedFeedback.distinct('semester');
      res.json({ semesters });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

// Export functions
module.exports = {
    getArchivedFeedback,
    getArchivedFeedbackStatus,
    downloadArchivedFeedback,
    getUniqueSemesters  // new function
};
