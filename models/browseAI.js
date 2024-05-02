var mongoose = require('mongoose');

const BrowseDataSchema = new mongoose.Schema({
    position: {
        type: String,
    },
    title: {
        type: String,
    },
    post_link: {
        type: String,
    },
    company: {
        type: String,
    },
    company_profile: {
        type: String,
    },
    location: {
        type: String,
    },
    actively_status: {
        type: String,
    },
    description: {
        type: String,
    },
    seniority_level: {
        type: String,
    },
    employment_type: {
        type: String,
    },
    job_function: {
        type: String,
    },
    industries: {
        type: String,
    },
    time_ago: {
        type: String,
    },
    domain: {
        type: String
    }
},
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    });

module.exports = {
    BrowseDatas: mongoose.model('BrowseDatas', BrowseDataSchema, 'BrowseDatas'),
};
