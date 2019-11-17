const express = require('express')
const app = express()
const port = 3000
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/RSO_EVENTS', {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection

db.on('error', (error) => console.error(error))
db.once('open', (error) => console.log('Connected to db'))

app.use(express.json())

const eventsRouter = require('./routes/events')
app.use('/events', eventsRouter)

app.listen(port, () => console.log(`Server started`))
