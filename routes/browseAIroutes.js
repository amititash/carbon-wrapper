const express = require('express');
const router = express.Router();
const browseController = require('../controller/browseAIcontroller');


router.get('/fetchAllRobotTask', browseController.fetchAllTaskofRobot);
router.get('/fetchRobotTaskById', browseController.fetchTaskofRobotById);

module.exports = router;
