const express = require('express')
const router = express.Router()
const Event = require('../models/event')
const fetch = require('node-fetch')
const {consul, lightship, logger} = require('../helpers')

let venuesService = null

if (process.env.NODE_ENV === 'prod') {
	const watcher = consul.watch({
		method: consul.health.service,
		options: {
			service: 'venues',
			passing: true
		}
	});

	watcher.on('change', data => {
		venuesService = null

		let entry = data.find(entry => entry.Service.Service === "venues")
		if (entry) venuesService = `http://${entry.Service.Address}:${entry.Service.Port}/`
	});

	watcher.on('error', err => {
		logger.error(err.message)
		lightship.shutdown()
	});
}

// get all events
router.get('/', async (req, res) => {
	logger.info('Get all events')

	try {
		let query = {}

		if (req.query.startDate) {
			let date1 = new Date(req.query.startDate).toISOString()

			let date2 = new Date(req.query.startDate)
			date2.setDate(date2.getDate() + 1)
			date2 = date2.toISOString()

			logger.info(`Query events by start date (${date1} - ${date2})`)

			query["startDate"] = { $gte: date1, $lt: date2 }
		}

		if (req.query.endDate) {
			let date1 = new Date(req.query.endDate).toISOString()

			let date2 = new Date(req.query.endDate)
			date2.setDate(date2.getDate() + 1)
			date2 = date2.toISOString()

			logger.info(`Query events by end date (${date1} - ${date2})`)

			query["endDate"] = { $gte: date1, $lt: date2 }
		}

		let events = await Event.find(query)

		events = events.map(async (event) => {
			if (event.venue) {
				await getVenue(event.venue)
					.then(res => {
						if (res && res.data && res.data.venue) {
							event = {...event._doc, ...{venue: res.data.venue}};
						} else {
							console.log("The venue with this id does not exist.", event.venue)
							logger.warn(`The venue with this id ${event.venue} does not exist.`)
							delete event.venue
						}
					})
			}
			return event
		})

		logger.info(JSON.stringify(events))

		Promise.all(events).then(events => res.status(200).json(events))
	} catch (e) {
		logger.error(e.message)
		res.status(500).json({message: e.message})
	}
})

// get one event
router.get('/event/:id', getEvent, async (req, res) => {
	logger.info(`Get event ${req.params.id}`)
	if (res.event.venue) {
		await getVenue(res.event.venue)
			.then(res => {
				if (res && res.data && res.data.venue) {
					res.event = {...res.event._doc, ...{venue: res.data.venue}};
				}
			})
	}
	logger.info(JSON.stringify(res.event))
	return res.status(200).json(res.event)
})

// create one event
router.post('/event', async (req, res) => {
	logger.info('Create event')

	if (req.body.startDate && req.body.endDate && (new Date(req.body.startDate)).getTime() >= (new Date(req.body.endDate)).getTime()) {
		logger.warn('Cannot create new event, because start date cannot be equal or greater than the end date.')
		return res.status(400).json({message: 'Start date cannot be equal or greater than the end date'})
	}

	const event = new Event({
		name: req.body.name,
		startDate: req.body.startDate,
		endDate: req.body.endDate,
		numberOfTickets: req.body.numberOfTickets,
		price: req.body.price,
		venue: req.body.venue,
		_createdAt: new Date(),
	})

	return event
		.save()
		.then(result => {
			logger.info(`Event with id ${result._id} was successfully created.`)
			return res.status(201).json(result)
		})
		.catch(err => {
			logger.error(err.message)
			return res.status(400).json({message: err.message})
		});
})

// update one event
router.patch('/event/:id', async (req, res) => {
	if (!req.params.id) {
		logger.warn(`Cannot update event because id is missing.`)
		return
	}

	if (req.body.startDate && req.body.endDate && (new Date(req.body.startDate)).getTime() >= (new Date(req.body.endDate)).getTime()) {
		logger.warn(`Cannot update event with id ${req.params.id}, because start date cannot be equal or greater than the end date.`)
		return res.status(400).json({message: 'Start date cannot be equal or greater than the end date'})
	}

	logger.info(`Update event ${req.params.id}`)

	Event.findOneAndUpdate({_id: req.params.id}, {...req.body, _updatedAt: new Date()}, {new: true})
		.then(updatedEvent => {
			logger.info(`Event with id ${req.params.id} was successfully updated.`)
			return res.status(200).json(updatedEvent)
		})
		.catch(err => {
			logger.error(err.message)
			return res.status(400).json({message: err.message})
		})
})

// delete one event
router.delete('/event/:id', async (req, res) => {
	if (!req.params.id) {
		logger.warn(`Cannot delete event because id is missing.`)
		return
	}

	logger.info(`Delete event ${req.params.id}`)

	return Event.deleteOne({ _id: req.params.id })
		.then(result => {
			if (result.deletedCount > 0) {
				logger.info(`Event (${req.params.id}) has been successfully deleted`)
				return res.status(204).send()
			} else {
				logger.error(`Event (${req.params.id}) has not been deleted. Something went wrong`)
				return res.status(500).send()
			}
		})
		.catch(err => {
			logger.error(err.message)
			return res.status(400).json({message: err.message})
		})
})

async function getEvent(req, res, next) {
	logger.info(`Find event by ID in Mongo ${req.params.id}`)

	let event

	try {
		event = await Event.findById(req.params.id)
		if (!event) {
			logger.error(`Can't find event ${req.params.id}`)
			return res.status(404).json({message: 'Can\'t find event.'})
		}
	} catch (e) {
		logger.error(e.message)
		return res.status(500).json({message: e.message})
	}

	res.event = event
	return next()
}

async function getVenue(id) {
	logger.info(`Get venue ${id}`)

	if (!venuesService) {
		logger.warn('Venues service is unavailable')
		return;
	}

	const query = {
		"query": `{
			venue(id: "${id}") {
				_id
				name
				description
				capacity
			}
		}`
	}

	logger.info(`Fetch venue at ${venuesService}. Query: ${query}`)

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
