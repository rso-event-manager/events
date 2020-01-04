const consul = require('consul')({
	host: process.env.CONSUL,
	port: 8500
})

const { createLightship } = require('lightship')
const lightship = createLightship({
	detectKubernetes: true
})

const healthWatcher = consul.watch({
	method: consul.health.service,
	options: {
		service: 'events',
	}
});

healthWatcher.on('change', data => {
	for (let el of data) {
		consul.agent.check.register({
			name: 'health',
			id: 'health',
			serviceid: el.Service.ID,
			http: 'http://localhost:9000/health',
			interval: '10s',
			timeout: '1s',
		}, function (err) {
			if (err) {
				console.log(err.message)
			}
		});
	}
});

// consul.agent.service.list(function(err, result) {
// 	if (err) throw err;
// 	console.log(result)
// });

// consul.agent.check.register({
// 	'name': 'Check events health',
// 	'http': 'http://localhost:9000/health',
// 	'interval': '10s',
// 	'timeout': '1s',
// 	'serviceid': 'events'
// }, function (err) {
// 	if (err) {
// 		console.log('err', err.message)
// 	}
// })

module.exports = {
	consul: consul,
	lightship: lightship,
}