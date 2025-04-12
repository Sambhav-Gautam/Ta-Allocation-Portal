const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Round = require('../models/Round');
const Admin = require('../models/Admin');
const LogEntry = require('../models/LogEntry');
const Feedback = require('../models/Feedback');
const FeedbackStatus = require('../models/FeedbackStatus');
const ArchivedFeedback = require('../models/ArchivedFeedback');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Function to determine the two most recent semesters to keep
const getSemestersToKeep = async () => {
    const semesters = await ArchivedFeedback.aggregate([
        { $group: { _id: "$semester", latestDate: { $max: "$archivedDate" } } },
        { $sort: { latestDate: -1 } },
        { $limit: 2 }
    ]);
    return semesters.map(s => s._id);
};

// Function to generate an Excel file for archived feedback
const generateExcelFile = async (data) => {
    const formattedData = data.map(feedback => ({
        Course: feedback.course ? `${feedback.course.code} - ${feedback.course.name}` : "N/A",
        Student: feedback.student ? `${feedback.student.rollNo} - ${feedback.student.name}` : "N/A",
        Professor: feedback.professor ? feedback.professor.name : "N/A",
        Overall_Grade: feedback.overallGrade,
        Regularity: feedback.regularityInMeeting,
        Attendance: feedback.attendanceInLectures,
        Preparedness: feedback.preparednessForTutorials,
        Timeliness: feedback.timelinessOfTasks,
        Quality_of_Work: feedback.qualityOfWork,
        Commitment: feedback.attitudeCommitment,
        Nominated_for_Best_TA: feedback.nominatedForBestTA ? "Yes" : "No",
        Comments: feedback.comments,
        Semester: feedback.semester,
        Archived_Date: feedback.archivedDate
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Archived Feedback");

    const filePath = path.join(__dirname, "../deleted_feedback.xlsx");
    XLSX.writeFile(workbook, filePath);
    return filePath;
};

// Function to send email notification with archived feedback
const sendNotificationEmail = async (currentSemester, excelFilePath) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.USERMAIL,
            pass: process.env.PASS,
        },
    });

    const mailOptions = {
        from: "sambhav22435@iiitd.ac.in",
        to: ["sambhavgautam6@gmail.com", "sambhav22435@iiitd.ac.in"],
        subject: `New Semester (${currentSemester}) Started - Archived Data`,
        text: `A new semester (${currentSemester}) has started. The old feedback data has been archived.\n\nAttached is the deleted feedback data in Excel format.`,
        attachments: [{ filename: "Deleted_Feedback.xlsx", path: excelFilePath }]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Notification email with Excel attachment sent.");
        fs.unlinkSync(excelFilePath); // Delete file after sending email
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

// API to start a new semester
const newSemester = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { currentSemester } = req.body;
        if (!currentSemester) {
            return res.status(400).json({ message: "Current semester is required" });
        }

        // Archive feedback
        const feedbacks = await Feedback.find().session(session);
        // if (feedbacks.length > 0) {
        //     const archivedFeedbacks = feedbacks.map(f => ({
        //         ...f.toObject(),
        //         semester: currentSemester,
        //         archivedDate: new Date(),
        //     }));
        //     await ArchivedFeedback.insertMany(archivedFeedbacks, { session });
        // }

        // Determine old semesters to delete
        const semestersToKeep = await getSemestersToKeep();
        semestersToKeep.push(currentSemester); // Ensure current semester is kept

        // Find and delete old feedback
        const deletedFeedback = await ArchivedFeedback.find({
            semester: { $nin: semestersToKeep }
        })
        .populate('course', 'name code')
        .populate('student', 'name rollNo')
        .populate('professor', 'name');

        if (deletedFeedback.length > 0) {
            const excelFilePath = await generateExcelFile(deletedFeedback);
            await ArchivedFeedback.deleteMany({ semester: { $nin: semestersToKeep } }).session(session);
            await sendNotificationEmail(currentSemester, excelFilePath);
        }

        // // Clear other entities
        // await Student.deleteMany().session(session);
        // await Course.deleteMany().session(session);
        // await Round.deleteMany().session(session);
        // await LogEntry.deleteMany().session(session);
        // await Feedback.deleteMany().session(session);

        // Reset admin access
        await Admin.findOneAndUpdate(
            {},
            { jmAccess: false, studentFormAccess: false, professorAccess: false },
            { new: true }
        ).session(session);

        // Update feedback status
        await FeedbackStatus.findOneAndUpdate(
            {},
            { active: false },
            { new: true }
        ).session(session);

        await session.commitTransaction();
        res.status(200).json({ message: 'Database cleared, feedback archived, and notification sent for a new semester' });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error in new semester API: ', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    } finally {
        session.endSession();
    }
});

module.exports = { newSemester };