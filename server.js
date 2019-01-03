const express = require('express');
const morgan = require('morgan');
const request = require('request').defaults({ encoding: null });
const rq = require('request-promise');
const bodyParser = require('body-parser');
const fs = require('fs');
let ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
let ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
let command = ffmpeg();

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
            const twoPI = Math.PI * 2;
            const rad2Deg = 57.2957795130823209;
            let angle = 0;
            let counter = -1;
            for (let i = 0; i < positions.polyline.length - 2; i++)
            {
                if (positions.polyline[i] !== positions.polyline[i + 1] || i === 0)
                {
                    // console.log(Math.atan2(positions.polyline[i + 1].lat - positions.polyline[i].lat,
                    //     positions.polyline[i].lng - positions.polyline[i + 1].lng));
                    let theta = Math.atan2(positions.polyline[i + 1].lat - positions.polyline[i].lat,
                        positions.polyline[i].lng - positions.polyline[i + 1].lng)
                    console.log(theta);

                    // console.log(theta);
                    // console.log(theta);
                    if (theta < 0.0)
                    {
                        theta += twoPI;
                    }
                    angle = rad2Deg * theta;

                    console.log(angle);

                    let imgUrl = "https://maps.googleapis.com/maps/api/streetview?size=1200x720&location=";
                    let elseUrl = `&heading=${angle - 90}&key=AIzaSyBldcMxKcF6eFmRk7XBbwjZAXwtIxL1dZQ`;
                    imgUrl = imgUrl + positions.polyline[i].lat + ',' + positions.polyline[i].lng + elseUrl;
                    counter++;
                    download(imgUrl, `assets/pics/st_${pad(counter + 1, 3)}.jpg`, function ()
                    {
                        console.log('done');
                    });
                }
            }

            // command
            //     .on('end', onEnd)
            //     .on('progress', onProgress)
            //     .on('error', onError)
            //     .input(__dirname + '/assets/pics/st_%03d.png')
            //     .inputFPS(1 / 5)
            //     .output(__dirname + '/assets/demo/meme.mp4')
            //     .noAudio()
            //     .run();

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

function onProgress(progress)
{
    if (progress.timemark != timemark) 
    {
        timemark = progress.timemark;
        console.log('Time mark: ' + timemark + "...");
    }
}

function onError(err, stdout, stderr)
{
    console.log('Cannot process video: ' + err.message);
}

function onEnd() 
{
    console.log('Finished processing');
}

function pad(n, width, z)
{
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

app.get('/api/meow', (req, res) =>
{
    command
        .on('end', onEnd)
        // .on('progress', onProgress)
        .on('error', onError)
        .input('assets/pics/st_%03d.jpg')
        .inputFPS(10)
        .output(__dirname + '/assets/demo/meme.mp4')
        .outputFps(30)
        .noAudio()
        .run();

    res.send('hey');
});

app.post('/api/log', (req, response) =>
{
    console.log(req.body.value1, req.body.value2);
    url = `https://maps.googleapis.com/maps/api/directions/json?&origin=${req.body.value1.split(" ").join("+")}&destination=${req.body.value2.split(" ").join("+")}&key=AIzaSyBldcMxKcF6eFmRk7XBbwjZAXwtIxL1dZQ`;

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

// app.get('/api/download', (req, response) =>
// {
//     // let img = new Image();
//     // img.src = "https://www.google.com/images/srpr/logo3w.png";
//     // download('https://www.google.com/images/srpr/logo3w.png', 'images/google.png', function ()
//     // {
//     //     console.log('done');
//     // });
//     let url = "https://www.google.com/images/srpr/logo3w.png";
//     request.get(url, (err, res, body) =>
//     {
//         console.log(body);
//         response.send('meow');
//     })
// });

let download = (uri, filename, callback) =>
{
    request.head(uri, (err, res, body) =>
    {
        // console.log('content-type:', res.headers['content-type']);
        // console.log('content-length:', res.headers['content-length']);

        // console.log(err);
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    }).on('error', error =>
    {
        console.log(error)
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