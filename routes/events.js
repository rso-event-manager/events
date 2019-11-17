const express = require('express')
const router = express.Router()
const Event = require('../models/event')

// get all events
router.get('/', async (req, res) => {
	try {
		const events = await Event.find()
		res.status(200).json(events)
	} catch (e) {
		res.status(500).json({ message: e.message })
	}
})

// get one event
router.get('/:id', getEvent, (req, res) => {
	res.json(res.event)
})

// create one event
router.post('/',  async (req, res) => {
	if (req.body.startDate && req.body.endDate && (new Date(req.body.startDate)).getTime() >= (new Date(req.body.endDate)).getTime()) {
		return res.status(400).json({ message: 'Start date cannot be equal or greater than the end date'})
	}

	const event = new Event({
		name: req.body.name,
	})

	if (req.body.startDate) {
		event.startDate = req.body.startDate
	}

	if (req.body.endDate) {
		event.endDate = req.body.endDate
	}

	if (req.body.numberOfTickets) {
		event.numberOfTickets = req.body.numberOfTickets
	}

	if (req.body.price) {
		event.price = req.body.price
	}

	try {
		const newEvent = await event.save()
		res.status(201).json(newEvent)
	} catch (e) {
		res.status(400).json({ message: e.message })
	}
})

// update one event
router.patch('/:id', getEvent, async (req, res) => {
	if (req.body.name != null) {
		res.event.name = req.body.name
	}

	if (req.body.startDate != null) {
		res.event.startDate = req.body.startDate
	}

	if (req.body.endDate != null) {
		res.event.endDate = req.body.endDate
	}

	if (req.body.numberOfTickets != null) {
		res.event.numberOfTickets = req.body.numberOfTickets
	}

	if (req.body.price != null) {
		res.event.price = req.body.price
	}

	try {
		const updatedEvent = await res.event.save()
		res.json(updatedEvent)
	} catch(e) {
		res.status(400).json({ message: e.message })
	}
})

// delete one event
router.delete('/:id', getEvent, async (req, res) => {
	try {
		await res.event.remove()
		res.status(204)
	} catch (e) {
		res.status(500).json({ message: e.message })
	}
})

async function getEvent(req, res, next) {
	let event

	try {
		event = await Event.findById(req.params.id)
		if (!event) {
			return res.status(404).json({ message: 'Can\'t find event.' })
		}
	} catch (e) {
		return res.status(500).json({ message: e.message })
	}

	res.event = event
	next()
}

module.exports = router