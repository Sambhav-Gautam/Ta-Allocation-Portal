const express = require('express');
const router = express.Router();
const {
  startFeedback,
  editFeedbackById,
  getFeedbacksByProfessorId,
  getAllFeedbacks,
  closeFeedback,
  getFeedbackStatus,
  downloadFeedbacks
} = require('../controllers/feedbackController');

// start a new feedback round
router.get('/start', startFeedback);

// update a feedback by its ID
router.put('/:id', editFeedbackById);

// get feedbacks for one professor
router.get('/professor/:professorId', getFeedbacksByProfessorId);

// get every feedback (admin only)
router.get('/all', getAllFeedbacks);

// get whether the feedback form is currently active
router.get('/status', getFeedbackStatus);

// download archived feedbacks as Excel
router.get('/download', downloadFeedbacks);

// close the feedback form: archive live, prune old archives, email, delete live, flip flag
// now matches @route POST /api/feedback/close
router.post('/close', closeFeedback);



module.exports = router;
