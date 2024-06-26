const express = require('express');
const router = express.Router();
const browseController = require('../controller/browseAIcontroller');


router.get('/fetchAllRobotTask', browseController.fetchAllTaskofRobot);
router.get('/fetchRobotTaskById', browseController.fetchTaskofRobotById);
router.get('/fetchDataFromDb', browseController.fetchDataOnbasisOfFields);
router.get('/fetchResultsWithFilters', browseController.fetchResultsWithFilters);
// router.get('/fetchResultsWithFiltersss', browseController.fetchResultsWithFiltersss);


module.exports = router;
