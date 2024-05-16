const axios = require('axios');
const { constants } = require('../config/constants');
const BrowseModel = require("../models/browseAI");


//fetch all data of robot
async function fetchAllTaskofRobot(req, res) {
    try {
        const robotId = req.query.robotId;
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


async function fetchDataOnbasisOfFields(req, res) {
    try {
        const userQuery = req.query.userQuery;

        if (!userQuery) {
            return res.status(400).json({ error: 'Missing required parameter: userQuery' });
        }

        // Specify the fields suitable for text search
        const textSearchFields = ['title', 'company', 'company_profile', 'location', 'description', 'actively_status', 'seniority_level', 'employment_type', 'industries', 'domain'];

        // const regex = new RegExp(userQuery, 'i');
        // const regex = new RegExp(userQuery.split(/\s+/).join('.*'), 'i');
        const regex = new RegExp(userQuery.split(/\s+/).join('|'), 'i');

        const query = {
            $or: textSearchFields.map(field => ({ [field]: regex }))
        };

        console.log("query :: ", query);
        const results = await BrowseModel.BrowseDatas.find(query);

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Nothing to show' });
        }

        return res.json({ status: true, results });
    } catch (error) {
        console.error("Error while fetching results:", error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}


async function fetchResultsWithFilters(req, res) {
    try {
        const query = {};

        for (const key in req.query) {
            if (req.query.hasOwnProperty(key)) {
                query[key] = { $regex: req.query[key], $options: 'i' };
            }
        }

        console.log("query :: ", query);
        const results = await BrowseModel.BrowseDatas.find(query);

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'No results found' });
        }

        return res.json({ status: true, results });
    } catch (error) {
        console.error("Error while fetching results:", error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}




// async function fetchResultsWithFiltersss(req, res) {
//     try {
//         const query = {};

//         // limit query parameters
//         const keys = Object.keys(req.query).slice(0, 2);

//         for (const key of keys) {
//             query[key] = { $regex: req.query[key], $options: 'i' };
//         }

//         // Implement pagination
//         const page = parseInt(req.query.page) || 1;
//         const pageSize = parseInt(req.query.pageSize) || 10;
//         const skip = (page - 1) * pageSize;

//         console.log("query :: ", query);
//         const results = await BrowseModel.BrowseDatas.find(query)
//             .limit(pageSize)
//             .skip(skip);

//         if (!results || results.length === 0) {
//             return res.status(404).json({ message: 'No results found' });
//         }

//         return res.json({ status: true, results });
//     } catch (error) {
//         console.error("Error while fetching results:", error);
//         return res.status(500).json({ error: 'Internal server error', message: error.message });
//     }
// }










module.exports = {
    fetchAllTaskofRobot,
    fetchTaskofRobotById,
    fetchDataOnbasisOfFields,
    fetchResultsWithFilters,
    // fetchResultsWithFiltersss
};
