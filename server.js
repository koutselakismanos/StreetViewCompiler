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
		url: "https://maps.googleapis.com/maps/api/directions/json?&moe=transit&origin=Chicago,IL&destination=Los+Angeles,CA&waypoints=Joplin,MO|Oklahoma+City,OK&key=AIzaSyDM1Md63YaQY-nPkpoK60q8S8MJ_2pjFgc",
		json: true
	}, (err, res, json) =>
		{
			if (err) throw err;
			let positions = {
				routes: [],
				polyline: ""
			};
			let snapUrl = "https://roads.googleapis.com/v1/snapToRoads?path="
			json.routes[0].legs.filter(leg => Object.getOwnPropertyNames(leg).includes("steps"))
				.forEach(leg => leg['steps'].forEach(step =>
				{
					// console.log(step.start_location);
					positions.routes.push(step.start_location);
					positions.routes.push(step.end_location);
					positions.polyline += step.polyline.points;
				}));
			// positions.polyline += json.routes[0].overview_polyline.points;

			let meow = decode(json.routes[0].overview_polyline.points);
			meow.forEach((element, i) =>
			{
				if (i < 100)
					snapUrl += `${element.lat},${element.lng}|`
			})
			snapUrl = snapUrl.substring(0, snapUrl.length - 1);
			snapUrl += "&interpolate=true&key=AIzaSyDM1Md63YaQY-nPkpoK60q8S8MJ_2pjFgc"
			console.log(snapUrl);
			request({
				url: snapUrl,
				json: true
			}, (err, res, json) =>
				{
					if (err) throw err;
					console.log(json);
				})
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


function decode(str, precision)
{
	var index = 0,
		lat = 0,
		lng = 0,
		coordinates = [],
		shift = 0,
		result = 0,
		byte = null,
		latitude_change,
		longitude_change,
		factor = Math.pow(10, precision || 5);

	// Coordinates have variable length when encoded, so just keep
	// track of whether we've hit the end of the string. In each
	// loop iteration, a single coordinate is decoded.
	while (index < str.length)
	{

		// Reset shift, result, and byte
		byte = null;
		shift = 0;
		result = 0;

		do
		{
			byte = str.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);

		latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

		shift = result = 0;

		do
		{
			byte = str.charCodeAt(index++) - 63;
			result |= (byte & 0x1f) << shift;
			shift += 5;
		} while (byte >= 0x20);

		longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

		lat += latitude_change;
		lng += longitude_change;

		coordinates.push({ lat: lat / factor, lng: lng / factor });
	}

	return coordinates;
};

app.listen(port, () => { console.log(`Server started on port ${port}`); });