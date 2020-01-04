const express = require('express')
const app = express()
const port = 3000
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection

db.on('error', (error) => console.error(error))
db.once('open', (error) => console.log('Connected to db'))

app.use(express.json())

const eventsRouter = require('./routes/events')
app.use('/events', eventsRouter)

app.get('/', async (req, res) => {
	res.send('Hello World!')
})

app.get('/mejnik', async (req, res) => {
	res.status(200).json({
		"clani": ["vr9223"],
		"opis_projekta": "Moj projekt implementira aplikacijo za dodajanje dogodkov, dvoran in prodajo vstopnic.",
		"mikrostoritve": ["https://rso-events.azurewebsites.net/events"],
		"github": ["https://github.com/rso-event-manager/events"],
		"travis": ["https://travis-ci.org/rso-event-manager/events"],
		"dockerhub": ["https://hub.docker.com/r/ribvid/rso-events"]
	})
})

app.listen(port, () => console.log(`Server started`))
