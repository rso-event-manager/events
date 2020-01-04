const consul = require('consul')({
	host: process.env.CONSUL,
	port: 8500
})

const { createLightship } = require('lightship')
const lightship = createLightship()

module.exports = {
	consul: consul,
	lightship: lightship,
}