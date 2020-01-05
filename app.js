const express = require('express')
const app = express()
const port = 3000
const mongoose = require('mongoose');
const { consul, lightship, logger } = require('./helpers')

const connect = (dbURL) => {
	mongoose.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true}).catch(err => {
		console.error(`Mongoose has failed. ${err.message}`)
		logger.error(`Mongoose has failed. ${err.message}`)
		lightship.signalNotReady()
	})

	const db = mongoose.connection
	db.on('error', (error) => {
		console.error(`Cannot connect to db ${dbURL}. ${error.message}`)
		logger.error(`Cannot connect to db ${dbURL}. ${error.message}`)
		lightship.signalNotReady()
	})

	db.once('open', (error) => {
		console.log('Connected to db')
		logger.info("Connected to db")
		lightship.signalReady()
	})
}

if (process.env.NODE_ENV === 'prod') {
	const watcher = consul.watch({
		method: consul.kv.get,
		options: {key: 'db/events'}
	})

	watcher.on('change', data => {
		connect(data.Value)
	})
} else {
	connect(process.env.DATABASE_URL)
}

app.use(express.json())

const eventsRouter = require('./routes/events')
app.use('/', eventsRouter)

app.use('/unhealthy', (req, res) => {
	lightship.shutdown()
	throw new Error('error')
})

const server = app.listen(port, () => {
	console.log(`Server started`)
	logger.info("Server started");
	lightship.signalReady()
})

lightship.registerShutdownHandler(() => {
	server.close();
});