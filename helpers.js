const consul = require('consul')({
	host: process.env.CONSUL,
	port: 8500
})

const {createLightship} = require('lightship')
const lightship = createLightship()

const winston = require('winston');
require('winston-logstash');

const logger = winston.createLogger(
	{
		level: 'info',
		format: winston.format.json(),
		defaultMeta: {
			name: "events",
			podName: process.env.NAME,
			version: process.env.VERSION,
			Environment: process.env.NODE_ENV
		},
	}, {
		level: 'error',
		format: winston.format.json(),
		defaultMeta: {
			name: "events",
			podName: process.env.NAME,
			version: process.env.VERSION,
			Environment: process.env.NODE_ENV
		},
	},
)

logger.add(winston.transports.Logstash, {
	port: 11667,
	host: '3f5a38c5-2098-4987-b32e-7f9815e9aaaf-ls.logit.io',
	ssl_enable: true,
	max_connect_retries: -1,
});

module.exports = {
	consul: consul,
	lightship: lightship,
	winston: logger,
}