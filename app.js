const express = require('express')
const app = express()
const port = 3000
const mongoose = require('mongoose');
const { consul, lightship } = require('./helpers')

const watcher = consul.watch({
	method: consul.kv.get,
	options: { key: 'db/events' }
})

watcher.on('change', data => {
	lightship.signalNotReady()

	mongoose.connect(data.Value, {useNewUrlParser: true, useUnifiedTopology: true}).catch(err => {
		console.error(`Mongoose has failed. ${err.message}`)
		lightship.shutdown()
	})

	const db = mongoose.connection
	db.on('error', (error) => {
		console.error(`Cannot connect to db ${data.Value}. ${error.message}`)
		lightship.shutdown()
	})
	db.once('open', (error) => {
		console.log('Connected to db')
		lightship.signalReady()
	})
})

app.use(express.json())

const eventsRouter = require('./routes/events')
app.use('/', eventsRouter)

app.use('/unhealthy', (req, res) => {
	lightship.shutdown()
	throw new Error('error')
})

const server = app.listen(port, () => {
	console.log(`Server started`)
	lightship.signalReady()
})

lightship.registerShutdownHandler(() => {
	server.close();
});
