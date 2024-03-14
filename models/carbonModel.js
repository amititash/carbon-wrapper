var mongoose = require('mongoose');

const CarbonDataSchema = new mongoose.Schema({
    url: {
        type: String
    },
    customer_id: {
        type: String
    },
    carbon: {
        type: Object
    }
},
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
);

module.exports = {
    CarbonDatas: mongoose.model('CarbonDatas', CarbonDataSchema, 'CarbonDatas'),
};
