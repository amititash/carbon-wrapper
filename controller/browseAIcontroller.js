const axios = require('axios');
const { constants } = require('../config/constants');
const { Parser } = require('json2csv');

//fetch all data of robot
async function fetchAllTaskofRobot(req, res) {
    try {
        const robotId = req.query.robotId; // Extracting robotId from query parameters
        if (!robotId) {
            return res.status(400).json({ error: 'Missing required parameter: robotId' });
        }

        const url = `${constants.browse_AI_Url}/v2/robots/${robotId}/tasks`;
        const headers = {
            Authorization: `Bearer ${constants.browse_AI_key}`,

            'Content-Type': 'application/json',
        };

        const response = await axios.get(url, { headers });

        if (response.status !== 200) {
            throw new Error(`Request failed with status code ${response.status}`);
        }

        const jobUrls = response.data.result.robotTasks.items.reduce((urls, item) => {
            const jobs = item['capturedLists']?.['Jobs'];
            if (jobs && Array.isArray(jobs)) {
                const postLinks = jobs.map(job => job['Post Link']).filter(url => url);
                urls.push(...postLinks);
            }
            return urls;
        }, []);

        return res.json(jobUrls);

        // console.log("this is browse response===>",response.data.result.robotTasks.items);
        // return res.json({ status: true, response: response.data.result.robotTasks.items });
    } catch (error) {
        console.error("Error while fetching browser AI task data:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}




//fetch the data of robot as per task id 
async function fetchTaskofRobotById(req, res) {
    try {
        const robotId = req.query.robotId;
        const taskId = req.query.taskId;

        if (!robotId || !taskId) {
            return res.status(400).json({ error: 'Missing required parameter: robotId or taskId' });
        }

        const url = `${constants.browse_AI_Url}/v2/robots/${robotId}/tasks/${taskId}`;
        const headers = {
            Authorization: `Bearer ${constants.browse_AI_key}`,
            'Content-Type': 'application/json',
        };

        const response = await axios.get(url, { headers });

        if (response.status !== 200) {
            throw new Error(`Request failed with status code ${response.status}`);
        }

        // Extracting post links from capturedLists
        // const jobUrls = response.data.result.capturedLists?.Jobs.map(job => job['Post Link']).filter(url => url);

        // return res.json({ status: true, jobUrls: jobUrls });
        return res.json({ status: true, response: response.data });

    } catch (error) {
        // console.error("Error while fetching browser AI task data:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports = {
    fetchAllTaskofRobot,
    fetchTaskofRobotById
};
