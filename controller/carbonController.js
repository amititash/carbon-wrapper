const CarbonModel = require("../models/carbonModel");
const axios = require("axios");
const { constants } = require("../config/constants");
const fs = require('fs');
const path = require("path");
const FormData = require("form-data");
const csvParser = require('csv-parser');
const readline = require('readline');
const { status: getTokenStatus } = require('tiktoken');

//index the URL files
async function indexFileViaURLs(req, res) {
    try {
        const { urls, customerId } = req.body;

        //validataion
        if (!urls || !customerId) {
            return res.status(400).json({ error: "Missing required parameters" });
        }
        const result = [];
        for (const url of urls) {
            try {
                const response = await axios.post(
                    `${constants.carbonApiUrl}/upload_file_from_url`,
                    {
                        url: url,
                        "chunk_size": 8000
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${constants.carbonApiKey}`,
                            "Content-Type": "application/json",
                            "customer-id": customerId,
                        },
                    }
                );
                // feeding the data
                let carbonData = {
                    url: url,
                    customer_id: customerId,
                    carbon: response.data,
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
            console.log("Saving data to database:", result);
            await CarbonModel.CarbonDatas.insertMany(result);
        } catch (error) {
            console.error("Error saving data to database:", error.message);
            return res
                .status(500)
                .json({ error: "An error occurred while saving data to the database" });
        }
        return res.json({ status: true, response: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//index the file CSV,PDF,
// async function indexFiles(req, res) {
//     try {
//         const { customerId } = req.body;
//         const file = req.file;

//         // Validation
//         if (!file || !customerId) {
//             return res.status(400).json({ error: "Missing required parameters" });
//         }

//         const formData = new FormData();
//         formData.append("file", file.buffer, { filename: file.originalname });

//         const response = await axios.post(
//             `${constants.carbonApiUrl}/uploadfile?chunk_size=8000`,
//             formData,
//             {
//                 headers: {
//                     Authorization: `Bearer ${constants.carbonApiKey}`,
//                     "Content-Type": "multipart/form-data",
//                     "customer-id": customerId,
//                 },
//             }
//         );

//         // Feeding the data
//         const carbonData = {
//             filename: file.originalname,
//             customer_id: customerId,
//             carbon: response.data,
//         };

//         // Save result to the database
//         await CarbonModel.CarbonDatas.create(carbonData);

//         return res.json({ status: true, response: carbonData });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// }


//test case of Array to index CSV and PDF
async function indexFiles(req, res) {
    try {
        const { customerId } = req.body;
        const files = req.files;

        // Validation
        if (!files || !customerId) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const result = [];

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file.buffer, { filename: file.originalname });

            const response = await axios.post(
                `${constants.carbonApiUrl}/uploadfile?chunk_size=8000`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${constants.carbonApiKey}`,
                        "Content-Type": "multipart/form-data",
                        "customer-id": customerId,
                    },
                }
            );

            // Feeding the data
            const carbonData = {
                filename: file.originalname,
                customer_id: customerId,
                carbon: response.data,
            };

            // Push result to the array
            result.push(carbonData);
        }

        // Save results to the database
        await CarbonModel.CarbonDatas.insertMany(result);

        return res.json({ status: true, response: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


//index web scrape
async function indexWebURLs(req, res) {
    try {
        const { urls, customerId, pages,depth } = req.body; //validataion

        if (!urls || !customerId) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        console.log("Request URLs:", urls); // Log the request URLs to the console

        const result = [];
        for (const url of urls) {
            try {
                const response = await axios.post(
                    `${constants.carbonApiUrl}/web_scrape`,
                    [
                        {
                            url: url,
                            "chunk_size": 8000,
                            "max_pages_to_scrape": pages,
                            "recursion_depth":depth,
                        },
                    ],
                    {
                        headers: {
                            Authorization: `Bearer ${constants.carbonApiKey}`,
                            "Content-Type": "application/json",
                            "customer-id": customerId,
                        },
                    }
                ); // feeding the data
                let carbonData = {
                    url: url,
                    customer_id: customerId,
                    carbon: response.data,
                };
                result.push(carbonData);
            } catch (error) {
                if (error.response && error.response.status === 422) {
                    console.error(`Error processing URL: ${url}`, error.response.data);
                } else {
                    console.error(`Error processing URL: ${url}`, error.message);
                } // choosing continue, will skip to the next URL
                continue;
            }
        } // Save results to the database
        try {
            // console.log("Saving data to database:", result);
            await CarbonModel.CarbonDatas.insertMany(result);
        } catch (error) {
            console.error("Error saving data to database:", error.message);
            return res
                .status(500)
                .json({ error: "An error occurred while saving data to the database" });
        }
        return res.json({ status: true, response: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//check all indexed carbon of customer
async function checkIndexedCarbon(req, res) {
    try {
        const { customerId } = req.body;

        // Validation
        if (!customerId) {
            return res
                .status(400)
                .json({ error: "Missing required parameter: customerId" });
        }

        const options = {
            headers: {
                Authorization: `Bearer ${constants.carbonApiKey}`,
                "Content-Type": "application/json",
                "customer-id": customerId,
            },
        };

        const requestBody = {
            pagination: { limit: 10 },
            order_by: "created_at",
            order_dir: "desc",
            filters: {
                organization_supplied_user_id: customerId,
            },
        };

        const response = await axios.post(
            `${constants.carbonApiUrl}/user_files_v2`,
            requestBody,
            options
        );

        // Check if the response contains data
        if (!response.data) {
            return res.status(404).json({ error: "No data found" });
        }

        res.json(response.data);
    } catch (error) {
        // Handle any errors
        res.status(500).json({ error: error.message });
    }
}

//resync the status of indexed file if error found
async function checkIndexedCarbonStatus(req, res) {
    try {
        const { carbonId } = req.body;

        // Validation
        if (!carbonId) {
            return res
                .status(400)
                .json({ error: "Missing required parameter: carbonId" });
        }

        // Fetch customer ID from database using carbon ID
        const carbonFile = await CarbonModel.CarbonDatas.findOne({
            "carbon.id": carbonId,
        });

        if (!carbonFile) {
            return res
                .status(404)
                .json({ error: "Carbon file not found in the database" });
        }

        const customerId = carbonFile.customer_id;

        // Make request to Carbon API to get sync status
        const options = {
            headers: {
                Authorization: `Bearer ${constants.carbonApiKey}`,
                "Content-Type": "application/json",
                "customer-id": customerId,
            },
        };

        const requestBody = {
            file_id: carbonId,
        };

        const response = await axios.post(
            `${constants.carbonApiUrl}/resync_file`,
            options,
            requestBody
        );

        // Update database with sync status
        carbonFile.carbon.sync_status = response.data.sync_status;
        await carbonFile.save();

        res.json(response.data);
    } catch (error) {
        if (error.response) {
            //console.error('Response data:', error.response.data);
            res.status(500).json({ error: error.response.data });
            //console.error('Response status:', error.response.status);
            res.status(500).json({ error: error.response.status });
            //console.error('Response headers:', error.response.headers);
            res.status(500).json({ error: error.response.headers });
        }

        res.status(500).json({ error: error.message });
    }
}

// listing out all indexed URLs and ID
async function listURLsAndCarbonIDs(req, res) {
    try {
        const allCarbonData = await CarbonModel.CarbonDatas.find();

        // Group documents by customer ID
        const groupedData = {};
        allCarbonData.forEach((data) => {
            if (!groupedData[data.customer_id]) {
                groupedData[data.customer_id] = [];
            }
            groupedData[data.customer_id].push({
                url: data.url,
                carbon_id: data.carbon.id,
            });
        });

        // Return the grouped data
        return res.json({ status: true, response: groupedData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    indexFileViaURLs,
    indexFiles,
    checkIndexedCarbon,
    checkIndexedCarbonStatus,
    listURLsAndCarbonIDs,
    indexWebURLs,
};
