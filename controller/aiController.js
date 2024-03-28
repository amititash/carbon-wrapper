const { constants } = require('../config/constants');
const axios = require('axios');
const CarbonModel = require('../models/carbonModel');


//in one go fetch data from BrowseAI and index in CarbonAI
async function fetchAndIndexData(req, res) {
    const { robotId, customerId, taskId } = req.query;

    try {
        // Fetch URLs from Browse AI
        const browseData = await fetchTaskData(robotId, taskId);

        // console.log("this is browse data ===>", browseData);

        // Check if the response contains the necessary data
        // if (!browseData || !browseData.result || !browseData.result.robotTasks || !Array.isArray(browseData.result.robotTasks.items)) {
        //     console.error('Error: Invalid response format from Browse AI');
        //     return res.status(500).json({ error: 'Invalid response format from Browse AI' });
        // }

        // Extract post links from Browse AI data
        const jobs = browseData.result.capturedLists.Jobs;
        const postLinks = jobs.map(job => job['Post Link']).filter(url => url);

        // Upload post links to Carbon AI for indexing
        // const carbonResponse = await indexDataToCarbonAI(postLinks, customerId);

        const savedData = [];
        for (const postLink of postLinks) {
            try {
                // Index data to Carbon AI 
                const carbonResponse = await indexDataToCarbonAI([postLink], customerId);

                // Save the URL in database
                const savedItem = await CarbonModel.CarbonDatas.create({
                    postLink: postLink,
                    customer_id: customerId,
                    carbon: carbonResponse
                });

                savedData.push(savedItem);
            } catch (error) {
                console.error(`Error processing URL: ${postLink}`, error.message);
                // on processing a URL if error comes, continue with the next URL
                continue;
            }
        }

        // Respond with success message / Carbon AI response
        res.json({ message: 'Data uploaded successfully to Carbon AI', savedData });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred while processing data' });
    }
}

// Fetch data from Browse AI
async function fetchTaskData(robotId, taskId) {
    const browseApiUrl = `${constants.browse_AI_Url}/v2/robots/${robotId}/tasks/${taskId}`;
    const browseApiKey = constants.browse_AI_key;

    try {
        const response = await axios.get(browseApiUrl, {
            headers: {
                Authorization: `Bearer ${browseApiKey}`,
                'Content-Type': 'application/json',
            }
        });
        return response.data; // Return response data instead of the whole response
    } catch (error) {
        console.error('Failed to fetch data from Browse AI:', error.message);
        throw new Error('Failed to fetch data from Browse AI');
    }
}

// Index data to Carbon AI
async function indexDataToCarbonAI(postLinks, customerId, chunkSize = 8000, maxPagesToScrape = 2, recursionDepth = 2) {

    const config = {
        headers: {
            'Authorization': `Bearer ${constants.carbonApiKey}`,
            'Content-Type': 'application/json',
            'customer-id': customerId
        }
    };
    try {
        // Transform postLinks to match Carbon AI payload format
        const requestBody = postLinks.map(postLink => ({
            url: postLink,
            chunk_size: chunkSize,
            max_pages_to_scrape: maxPagesToScrape,
            recursion_depth: recursionDepth
        }));

        const response = await axios.post(`${constants.carbonApiUrl}/web_scrape`, requestBody, config);
        return response.data;
    } catch (error) {
        console.error('Failed to index data to Carbon AI:', error.message);
        throw new Error('Failed to index data to Carbon AI');
    }
}

module.exports = {
    fetchAndIndexData
};
