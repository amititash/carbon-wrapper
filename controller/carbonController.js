const CarbonModel = require("../models/carbonModel");
const axios = require("axios");
const { constants } = require("../config/constants");
const FormData = require("form-data");
const readline = require('readline');
const stream = require('stream');
const fs = require('fs');

//index the URL files
async function indexFileViaURLs(req, res) {
    try {
        const { urls, customerId } = req.body;

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
                        "chunk_size": 2048
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
                console.error(`Error processing URL: ${url}`, error.message);
                result.push({ message: `Error in processing URL: ${url}`, error: error.message });
                continue;
            }
        }
        // Save results to the database
        try {
            if (result.length > 0) {
                console.log("Saving data to database:", result);
                await CarbonModel.CarbonDatas.insertMany(result);
            }
        } catch (error) {
            console.error("Error saving data to database:", error.message);
            return res.status(500).json({ error: "An error occurred while saving data to the database" });
        }

        if (result.length > 0) {
            return res.status(200).json({ status: true, message: "URLs successfully indexed in Carbon.", response: result });
        } else {
            return res.status(400).json({ error: "All URLs failed to index." });
        }
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

        if (!files || !customerId) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const result = [];

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file.buffer, { filename: file.originalname });

            const response = await axios.post(
                `${constants.carbonApiUrl}/uploadfile?chunk_size=2048`,
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
            result.push(carbonData);
        }

        // Save results to the database
        try {
            if (result.length > 0) {
                await CarbonModel.CarbonDatas.insertMany(result);
            }
        } catch (error) {
            console.error("Error saving data to database:", error.message);
            return res.status(500).json({ error: "An error occurred while saving data to the database" });
        }
        // Returning response
        if (result.length > 0) {
            return res.json({ status: true, message: "Files successfully indexed in Carbon.", response: result });
        } else {
            return res.status(400).json({ status: false, error: "All files failed to index." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


//index web scrape
async function indexWebURLs(req, res) {
    try {
        const { urls, customerId, pages, depth } = req.body;

        if (!urls || !customerId) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        // console.log("Request URLs:", urls);

        const result = [];
        for (const url of urls) {
            try {
                const response = await axios.post(
                    `${constants.carbonApiUrl}/web_scrape`,
                    [
                        {
                            url: url,
                            "chunk_size": 2048,
                            "max_pages_to_scrape": pages,
                            "recursion_depth": depth,
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
                }
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
        return res.json({ status: true, message: "Web Url successuly indexed in carbon.", response: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


//resync the status of indexed file if error found
async function resyncIndexedCarbonStatus(req, res) {
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

// listing out all indexed URLs and ID from Database
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

//check READY status and all indexed carbon of customer
async function checkReadyIndexedCarbon(req, res) {
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
            pagination: {
                limit: 123,
            },
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
        if (!response.data || !Array.isArray(response.data.results)) {
            return res.status(404).json({ error: "No data found " });
        }

        // Filter out non-ready files 
        const nonReadyFiles = response.data.results.filter(file => file.sync_status !== 'READY');
        const nonReadyCount = nonReadyFiles.length;

        if (nonReadyCount === 0) {
            return res.json({ message: "All files are in READY status", count: 0, allResponse: response.data });
        } else {
            // Send the non-ready files count along with the list of non-ready files
            res.json({
                count: nonReadyCount,
                nonReadyFiles: nonReadyFiles.map(file => ({
                    id: file.id,
                    sync_status: file.sync_status,
                    sync_error_message: file.sync_error_message,
                    // external_url: file.external_url
                })),
                allResponse: response.data
            });
        }

        // res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


//object by object indexing of json file 
async function indexDataObjByObj(req, res) {
    try {
        const { customerId } = req.body;
        const file = req.file;

        // Check if file and customerId are provided
        if (!file || !customerId) {
            return res.status(400).json({ error: "Missing file or customerId parameter" });
        }

        try {
            // Parse the JSON data
            const jobListings = JSON.parse(file.buffer.toString('utf8'));

            // Prepare to index individually
            const result = [];
            for (let i = 0; i < jobListings.length; i++) {
                const job = jobListings[i];

                console.log("this is job :::", job)

                const requestBody = {
                    contents: JSON.stringify(job),
                    name: job.Title,
                    chunk_size: 8000,
                    chunk_overlap: 123,
                    skip_embedding_generation: true,
                    overwrite_file_id: null,
                    embedding_model: "OPENAI",
                };

                // console.log("Request body:", requestBody);

                // Send data to Carbon AI
                try {
                    const response = await axios.post(
                        'https://api.carbon.ai/upload_text',
                        requestBody,
                        {
                            headers: {
                                Authorization: `Bearer ${constants.carbonApiKey}`,
                                'Content-Type': 'application/json',
                                "customer-id": customerId,
                            }
                        }
                    );

                    // console.log("Response from API:", response.data);

                    // Collect data for saving to database
                    let carbonData = {
                        url: job.Title,
                        customer_id: customerId,
                        carbon: response.data,
                    };
                    result.push(carbonData);
                } catch (error) {
                    console.error("Error response from API:", error.response.data);
                    return res.status(422).json({ error: error.response.data });
                }
            }

            // Save results to the database
            try {
                await CarbonModel.CarbonDatas.insertMany(result);
            } catch (error) {
                console.error("Error saving data to database:", error.message);
                return res.status(500).json({ error: "An error occurred while saving data to the database" });
            }

            return res.json({ status: true, message: "All objects uploaded and processed successfully" });
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return res.status(422).json({ error: "Error parsing JSON" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//index data from unilab playground
async function indexDatafromPlayground(req, res) {
    try {
        const { fileType, customerId } = req.body;

        if (!fileType || !customerId) {
            return res.status(400).json({ message: "Missing required parameters" });
        }

        const allowedCustomerIDs = constants.ALLOWED_CUSTOMER_IDS ? constants.ALLOWED_CUSTOMER_IDS.split(",") : [];
        // console.log(allowedCustomerIDs);

        if (!allowedCustomerIDs.includes(customerId)) {
            return res.status(400).json({ status: false, message: "Invalid customer ID" });
        }

        switch (fileType) {
            case "url":
                // console.log("url executed");
                return await indexFileViaURLs(req, res);
            case "file":
                // console.log("file executed");
                return await indexFiles(req, res);
            case "web":
                // console.log("web executed");
                return await indexWebURLs(req, res);
            default:
                return res.status(400).json({ error: "Unsupported file type" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error occurred.", error: error.message });
    }
}

async function deleteFiles(req, res) {
    try {
        const { customerId, fileIds } = req.body;

        if (!fileIds || !customerId) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const body = {
            "filters": {
                "ids": fileIds,
            }
        };

        const response = await axios.post(`https://api.carbon.ai/delete_files_v2`, body, {
            headers: {
                Authorization: `Bearer ${constants.carbonApiKey}`,
                'Content-Type': 'application/json',
                "customer-id": customerId,
            }
        });

        console.log("carbon rrsponse :: ", response.data);
        if (response.data.success) {
            // console.log('Deleting from MongoDB with parameters:', {
            //     customer_id: customerId,
            //     'carbon.id': { $in: fileIds }
            // });

            try {
                const deleteResult = await CarbonModel.CarbonDatas.deleteMany({
                    customer_id: customerId,
                    'carbon.id': { $in: fileIds },
                });

                // Log the result of the deletion
                console.log('MongoDB delete result:', deleteResult);

                if (deleteResult.deletedCount > 0) {
                    return res.json({ status: true, message: "Files successfully deleted from Carbon and database." });
                } else {
                    console.error("No matching documents found in MongoDB for deletion.");
                    return res.status(404).json({ status: false, error: "No matching documents found in database." });
                }
            } catch (error) {
                console.error("Error deleting data from database:", error.message);
                return res.status(500).json({ error: "An error occurred while deleting data from the database" });
            }
        } else {
            console.error("Failed to delete files from Carbon:", response.data);
            return res.status(400).json({ status: false, error: "Failed to delete files from Carbon.", details: response.data });
        }
    } catch (error) {
        if (error.response) {
            console.error(`Request failed with status code ${error.response.status}`);
            console.error("Error response data:", error.response.data);
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        console.error("Request config:", error.config);
        return res.status(500).json({ error: "Failed to delete files: server error" });
    }
}



module.exports = {
    indexFileViaURLs,
    indexFiles,
    resyncIndexedCarbonStatus,
    listURLsAndCarbonIDs,
    indexWebURLs,
    checkReadyIndexedCarbon,
    indexDataObjByObj,
    indexDatafromPlayground,
    deleteFiles
};