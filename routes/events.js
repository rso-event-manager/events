const express = require('express')
const router = express.Router()
const Event = require('../models/event')
const fetch = require('node-fetch')
const { consul, lightship } = require('../helpers')

const watcher = consul.watch({
	method: consul.health.service,
	options: {
		service: 'venues',
		passing: true
	}
});

let venuesService = null

watcher.on('change', data => {
	venuesService = null

	let entry = data.find(entry => entry.Service.Service === "venues")
	if (entry) venuesService = `http://${entry.Service.Address}:${entry.Service.Port}/`
});

watcher.on('error', err => {
	lightship.signalNotReady()
});

// get all events
router.get('/', async (req, res) => {
	try {
		let events = await Event.find()
		events = events.map(async (event) => {
			if (event.venue) {
				await getVenue(event.venue)
					.then(res => {
						if (res && res.data && res.data.venue) {
							event = {...event._doc, ...{venue: res.data.venue}};
						} else {
							console.log("The venue with this does not exist.", event.venue)
							delete event.venue
						}
					})
			}
			return event
		})
		Promise.all(events).then(events => res.status(200).json(events))
	} catch (e) {
		res.status(500).json({message: e.message})
	}
})

// get one event
router.get('/event/:id', getEvent, async (req, res) => {
	if (res.event.venue) {
		await getVenue(res.event.venue)
			.then(res => {
				if (res && res.data && res.data.venue) {
					res.event = {...res.event._doc, ...{venue: res.data.venue}};
				}
			})
	}
	return res.status(200).json(res.event)
})

// create one event
router.post('/event', async (req, res) => {
	if (req.body.startDate && req.body.endDate && (new Date(req.body.startDate)).getTime() >= (new Date(req.body.endDate)).getTime()) {
		return res.status(400).json({message: 'Start date cannot be equal or greater than the end date'})
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

	if (req.body.venue) {
		event.venue = req.body.venue
	}

	try {
		const newEvent = await event.save()
		return res.status(201).json(newEvent)
	} catch (e) {
		return res.status(400).json({message: e.message})
	}
})

// update one event
router.patch('/event/:id', getEvent, async (req, res) => {
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

	if (req.body.venue != null) {
		res.event.venue = req.body.venue
	}

	try {
		const updatedEvent = await res.event.save()
		return res.json(updatedEvent)
	} catch (e) {
		return res.status(400).json({message: e.message})
	}
})

// delete one event
router.delete('/event/:id', getEvent, async (req, res) => {
	try {
		await res.event.remove()
		return res.status(204)
	} catch (e) {
		return res.status(500).json({message: e.message})
	}
})

async function getEvent(req, res, next) {
	let event

	try {
		event = await Event.findById(req.params.id)
		if (!event) {
			return res.status(404).json({message: 'Can\'t find event.'})
		}
	} catch (e) {
		return res.status(500).json({message: e.message})
	}

	res.event = event
	return next()
}

async function getVenue(id) {
	if (!venuesService) return;

	const query = {
		"query": `{
			venue(id: "${id}") {
				name
				description
				capacity
			}
		}`
	}

	const res = await fetch(`${venuesService}graphql`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(query),
	})

	const data = await res.json()

	return data
}

module.exports = router
