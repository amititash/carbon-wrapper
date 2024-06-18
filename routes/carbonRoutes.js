const express = require('express');
const router = express.Router();
const multer = require('multer');
const carbonController = require('../controller/carbonController');
const aiController = require('../controller/aiController');

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/indexUrls', carbonController.indexFileViaURLs);
// router.post('/indexFiles', upload.single('file'), carbonController.indexFiles);
router.post('/indexFiles', upload.array('files'), carbonController.indexFiles);
router.post('/indexWebUrls', carbonController.indexWebURLs);
router.post('/resyncFileStatus', carbonController.resyncIndexedCarbonStatus);
router.get('/listAllurlId', carbonController.listURLsAndCarbonIDs);
router.post('/checkReadyIndexedCarbon', carbonController.checkReadyIndexedCarbon);

router.post('/indexDataObjByObj', upload.single('file'), carbonController.indexDataObjByObj);

router.post('/indexDatafromPlayground', upload.array('files'), carbonController.indexDatafromPlayground);


//this is direct route for index data from browes AI anf index to carbon AI
router.get('/fetchAndIndexData', aiController.fetchAndIndexData);



module.exports = router;