const consul = require('consul')({
	host: process.env.CONSUL,
	port: 8500
})
const winston = require('winston');
require('winston-logstash');
const {createLightship} = require('lightship')

const lightship = createLightship()

winston.add(winston.transports.Logstash, {
	port: 11667,
	host: '3f5a38c5-2098-4987-b32e-7f9815e9aaaf-ls.logit.io',
	ssl_enable: true,
	max_connect_retries: -1,
});

const additionalWinstonData = {
	name: "events",
	podName: process.env.NAME,
	version: process.env.VERSION,
	environment: process.env.NODE_ENV
}

const logger = {
	info: (msg) => winston.info(msg, additionalWinstonData),
	error: (msg) => winston.error(msg, additionalWinstonData),
	warn: (msg) => winston.warn(msg, additionalWinstonData),
}

module.exports = {
	consul: consul,
	lightship: lightship,
	logger: logger,
}