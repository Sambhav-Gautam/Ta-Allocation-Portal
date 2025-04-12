const mongoose = require('mongoose');

const archivedFeedbackSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    professor: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor' },
    overallGrade: String,
    regularityInMeeting: String,
    attendanceInLectures: String,
    preparednessForTutorials: String,
    timelinessOfTasks: String,
    qualityOfWork: String,
    attitudeCommitment: String,
    nominatedForBestTA: Boolean,
    comments: String,
    semester: String,
    archivedDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ArchivedFeedback', archivedFeedbackSchema);
