const asyncHandler = require('express-async-handler');
const ArchivedFeedback = require('../models/ArchivedFeedback');

// @desc Get all archived feedbacks
// @route GET /api/archived-feedback
// @access Admin only
const getArchivedFeedback = asyncHandler(async (req, res) => {
    try {
        const { semester } = req.query;
        const filter = semester ? { semester } : {};
        const archivedFeedback = await ArchivedFeedback.find(filter)
            .populate('course', 'name code')
            .populate('student', 'name rollNo')
            .populate('professor', 'name');
        res.json(archivedFeedback);
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

// Export functions
module.exports = {
    getArchivedFeedback,
    getArchivedFeedbackStatus
};
