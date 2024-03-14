const express = require('express');
const router = express.Router();
const carbonController = require('../controller/carbonController');

router.post('/indexUrls', carbonController.indexURLs);
router.post('/checkIndexedCarbon-ofCustomer', carbonController.checkIndexedCarbon);
router.post('/checkFileStatus', carbonController.checkIndexedCarbonStatus);
router.get('/listAllurlId', carbonController.listURLsAndCarbonIDs);

module.exports = router;
