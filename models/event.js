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
	venue: {
		type: mongoose.SchemaTypes.ObjectId,
	},
	_createdAt: {
		type: Date,
	},
	_updatedAt: {
		type: Date,
	},
})

module.exports = mongoose.model('Event', eventSchema)