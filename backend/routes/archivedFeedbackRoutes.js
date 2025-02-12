const express = require('express');
const { getArchivedFeedback, 
    archiveFeedback, 
    getArchivedFeedbackStatus } = require('../controllers/archivedFeedbackController');

const router = express.Router();

router.get('/archived-feedback', getArchivedFeedback);
router.get('/archived-feedback/status', getArchivedFeedbackStatus); 

module.exports = router;
