const ArchivedFeedback = require('../models/ArchivedFeedback');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Round = require('../models/Round');
const Admin = require('../models/Admin');
const LogEntry = require('../models/LogEntry');
const Feedback = require('../models/Feedback');
const FeedbackStatus = require('../models/FeedbackStatus');

// api/new/semester
const newSemester = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Archive current feedback
        const feedbacks = await Feedback.find().session(session);
        if (feedbacks.length > 0) {
            const archivedFeedbacks = feedbacks.map(f => ({
                ...f.toObject(),
                semester: `Semester-${new Date().getFullYear()}`,
            }));
            await ArchivedFeedback.insertMany(archivedFeedbacks, { session });
        }


        // Commenting these only for now ..
        // // Clear other entities
        // await Student.deleteMany().session(session);
        // await Course.deleteMany().session(session);
        // await Round.deleteMany().session(session);
        // await LogEntry.deleteMany().session(session);
        // await Feedback.deleteMany().session(session);

        // // Reset admin access
        // await Admin.findOneAndUpdate(
        //     {},
        //     { jmAccess: false, studentFormAccess: false, professorAccess: false },
        //     { new: true }
        // ).session(session);

        // // Update feedback status
        // await FeedbackStatus.findOneAndUpdate(
        //     {},
        //     { active: false },
        //     { new: true }
        // ).session(session);

        await session.commitTransaction();
        res.status(200).json({ message: 'Database cleared for a new semester' });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error in new semester API: ', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    } finally {
        session.endSession();
    }
});

module.exports = { newSemester };
