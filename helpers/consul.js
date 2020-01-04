module.exports = require('consul')({
	host: process.env.CONSUL,
	port: 8500
})
