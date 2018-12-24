const express = require('express');
const morgan = require('morgan');
const request = require('request');

const app = express();
const port = 5000;

app.use(morgan('dev'));

app.get('/api/', (req, res) =>
{
	res.status(200).sendFile('views/test.html', { root: __dirname });
});

app.get('/api/route/', (req, response) =>
{
	request({
		url: "https://maps.googleapis.com/maps/api/directions/json?origin=Chicago,IL&destination=Los+Angeles,CA&waypoints=Joplin,MO|Oklahoma+City,OK&key=AIzaSyDM1Md63YaQY-nPkpoK60q8S8MJ_2pjFgc",
		json: true
	}, (err, res, json) =>
		{
			let positions = {
				routes: []
			};
			if (err) throw err;
			json.routes[0].legs.filter(leg => Object.getOwnPropertyNames(leg).includes("steps"))
				.forEach(leg => leg['steps'].forEach(step =>
				{
					// console.log(step.start_location);
					positions.routes.push(step.start_location);
					positions.routes.push(step.end_location);
				}));

			response.json(positions);
			// console.log(positions);
			// 	.forEach(element =>
			// {
			// 	console.log(element.start_location);
			// 	positions.push(element.start_location);
			// });
		})

	// console.log(positions);
});

app.listen(port, () => { console.log(`Server started on port ${port}`); });