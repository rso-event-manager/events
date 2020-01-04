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
	mongoose.connect(data.Value, {useNewUrlParser: true, useUnifiedTopology: true}).catch(err => {
		console.error(`Mongoose has failed. ${err.message}`)
	})

	const db = mongoose.connection
	db.on('error', (error) => {
		console.error(`Cannot connect to db ${data.Value}. ${error.message}`)
		lightship.signalNotReady()
	})
	db.once('open', (error) => {
		console.log('Connected to db')
		lightship.signalReady()
	})
})

app.use(express.json())

const eventsRouter = require('./routes/events')
app.use('/events', eventsRouter)

app.use('/', (req, res) => res.send('Test3'))

app.listen(port, () => {
	console.log(`Server started`)
	lightship.signalReady()
})
