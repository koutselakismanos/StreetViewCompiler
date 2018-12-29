const express = require('express');
const morgan = require('morgan');
const request = require('request');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 5000;
let url;

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/', (req, res) =>
{
    res.status(200).sendFile('views/test.html', { root: __dirname });
});

app.get('/api/route/', (req, response) =>
{
    console.log(url);
    request({
        url,
        json: true
    }, (err, res, json) =>
        {
            if (err) throw err;
            let positions = {
                routes: [],
                polyline: []
            };
            // let snapUrl = "https://roads.googleapis.com/v1/snapToRoads?path="
            json.routes[0].legs.filter(leg => Object.getOwnPropertyNames(leg).includes("steps"))
                .forEach(leg => leg['steps'].forEach(step =>
                {
                    // console.log(step.start_location);
                    // positions.routes.push(step.start_location);
                    // positions.routes.push(step.end_location);
                    positions.polyline.push(...decode(step.polyline.points));
                }));
            // positions.polyline += json.routes[0].overview_polyline.points;
            // let meow = decode(json.routes[0].overview_polyline.points);
            // meow.forEach((element, i) =>
            // {
            // 	if (i < 100)
            // 		snapUrl += `${element.lat},${element.lng}|`
            // })
            // snapUrl = snapUrl.substring(0, snapUrl.length - 1);
            // snapUrl += "&interpolate=true&key=AIzaSyDM1Md63YaQY-nPkpoK60q8S8MJ_2pjFgc"
            // console.log(snapUrl);
            // request({
            // 	url: snapUrl,
            // 	json: true
            // }, (err, res, json) =>
            // 	{
            // 		if (err) throw err;
            // 		console.log(json);
            // 	})
            download(url, 'google.png', function ()
            {
                console.log('done');
            });

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

app.post('/api/log', (req, response) =>
{
    console.log(req.body.value1, req.body.value2);
    url = `https://maps.googleapis.com/maps/api/directions/json?&origin=${req.body.value1.split(" ").join("+")}&destination=${req.body.value2.split(" ").join("+")}&key=AIzaSyDM1Md63YaQY-nPkpoK60q8S8MJ_2pjFgc`;

    console.log(url)
    // request({
    // 	url,
    // 	json: true
    // }, (err, res, json) =>
    // 	{
    // 		if (err) throw err;
    // 		let positions = {
    // 			routes: [],
    // 			polyline: []
    // 		};
    // 		// let snapUrl = "https://roads.googleapis.com/v1/snapToRoads?path="
    // 		json.routes[0].legs.filter(leg => Object.getOwnPropertyNames(leg).includes("steps"))
    // 			.forEach(leg => leg['steps'].forEach(step =>
    // 			{
    // 				positions.polyline.push(...decode(step.polyline.points));
    // 			}));
    // 		response.json(positions);
    // 	})
});

app.get('/api/download', (req, res) =>
{
    download('https://www.google.com/images/srpr/logo3w.png', 'images/google.png', function ()
    {
        console.log('done');
    });
});

let download = (uri, filename, callback) =>
{
    request.head(uri, (err, res, body) =>
    {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};


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

app.listen(port, '0.0.0.0', () => { console.log(`Server started on port ${port}`); });