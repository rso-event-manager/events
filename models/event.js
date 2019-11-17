const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	startDate: {
		type: Date,
	},
	endDate: {
		type: Date,
	},
	numberOfTickets: {
		type: Number,
	},
	price: {
		type: Number,
	},
})

module.exports = mongoose.model('Event', eventSchema)