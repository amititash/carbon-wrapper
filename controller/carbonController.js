const CarbonModel = require('../models/carbonModel');
const axios = require('axios');
const { constants } = require('../config/constants');


//index the URL files 
async function indexURLs(req, res) {
    try {
        const { urls, customerId } = req.body;

        //validataion 
        if (!urls || !customerId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const result = [];
        for (const url of urls) {
            try {
                const response = await axios.post(`${constants.carbonApiUrl}/upload_file_from_url`, {
                    url: url,
                }, {
                    headers: {
                        'Authorization': `Bearer ${constants.carbonApiKey}`,
                        'Content-Type': 'application/json',
                        'customer-id': customerId
                    }
                });

                // feeding the data
                let carbonData = {
                    url: url,
                    customer_id: customerId,
                    carbon: response.data
                };
                result.push(carbonData);
            } catch (error) {
                // Handle error for individual URL request
                console.error(`Error processing URL: ${url}`, error.message);
                // choosing continue, it will just skip to the next URL
                continue;
            }
        }
        // Save results to the database
        try {
            await CarbonModel.CarbonDatas.insertMany(result);
        } catch (error) {
            console.error('Error saving data to database:', error.message);
            return res.status(500).json({ error: 'An error occurred while saving data to the database' });
        }
        return res.json({ status: true, response: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//check if indexed or not
async function checkIndexedCarbon(req, res) {
    try {
        const { customerId } = req.body;

        // Validation
        if (!customerId) {
            return res.status(400).json({ error: 'Missing required parameter: customerId' });
        }

        const options = {
            headers: {
                'Authorization': `Bearer ${constants.carbonApiKey}`,
                'Content-Type': 'application/json',
                'customer-id': customerId
            }
        };

        const requestBody = {
            pagination: { limit: 10 },
            order_by: 'created_at',
            order_dir: 'desc',
            filters: {
                organization_supplied_user_id: customerId,
            },
        };

        const response = await axios.post(`${constants.carbonApiUrl}/user_files_v2`, requestBody, options);

        // Check if the response contains data
        if (!response.data) {
            return res.status(404).json({ error: 'No data found' });
        }

        res.json(response.data);
    } catch (error) {
        // Handle any errors
        res.status(500).json({ error: error.message });
    }
}



async function checkIndexedCarbonStatus(req, res) {
    try {
        const { carbonId } = req.body;

        // Validation
        if (!carbonId) {
            return res.status(400).json({ error: 'Missing required parameter: carbonId' });
        }

        // Fetch customer ID from database using carbon ID
        const carbonFile = await CarbonModel.CarbonDatas.findOne({ 'carbon.id': carbonId });

        // console.log("this is carbon file ===>", carbonFile);

        if (!carbonFile) {
            return res.status(404).json({ error: 'Carbon file not found in the database' });
        }

        const customerId = carbonFile.customer_id;

        // Make request to Carbon API to get sync status
        const options = {
            headers: {
                'Authorization': `Bearer ${constants.carbonApiKey}`,
                'Content-Type': 'application/json',
                'customer-id': customerId
            }
        };

        const requestBody = {
            file_id: carbonId
        };

        const response = await axios.post(`${constants.carbonApiUrl}/resync_file`, requestBody, options);

        // Update database with sync status
        carbonFile.carbon.sync_status = response.data.carbon.sync_status;
        await carbonFile.save();

        res.json(response.data);
    } catch (error) {

        // if (error.response) {
        //     console.error('Response data:', error.response.data);
        //     console.error('Response status:', error.response.status);
        //     console.error('Response headers:', error.response.headers);
        // }

        res.status(500).json({ error: error.response.data });
    }
}

// listing out all indexed URLs and ID
async function listURLsAndCarbonIDs(req, res) {
    try {
        const allCarbonData = await CarbonModel.CarbonDatas.find();

        // Group documents by customer ID
        const groupedData = {};
        allCarbonData.forEach(data => {
            if (!groupedData[data.customer_id]) {
                groupedData[data.customer_id] = [];
            }
            groupedData[data.customer_id].push({ url: data.url, carbon_id: data.carbon.id });
        });

        // Return the grouped data
        return res.json({ status: true, response: groupedData });
    } catch (error) {
        res.status(500).json({ error: error.message });

    }
}


module.exports = {
    indexURLs,
    checkIndexedCarbon,
    checkIndexedCarbonStatus,
    listURLsAndCarbonIDs
};
