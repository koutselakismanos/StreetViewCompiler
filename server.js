const express = require('express');
const socket = require('socket.io');
const morgan = require('morgan');
const rq = require('request')//.defaults({ encoding: null });
// const rq = require('request-promise');
const bodyParser = require('body-parser');
const fs = require('fs');
const async = require('async');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
let command = ffmpeg();

const app = express();
const port = 5000;
let url;

let server = app.listen(port, '0.0.0.0', () =>
{
    console.log(`Server started on port ${port}`);
});

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/', (req, res) =>
{
    res.status(200).sendFile('views/test.html', { root: __dirname });
});


app.get('/api/result', (req, res) =>
{
    res.sendFile(__dirname + '/views/home.html');
})

app.get('/api/route/', (req, response) =>
{
    console.log(url);
    let imgUrls = [];
    rq({
        url,
        json: true
    }, (err, res, json) =>
        {
            if (err) throw err;
            let positions = {
                routes: [],
                polyline: []
            };
            json.routes[0].legs.filter(leg => Object.getOwnPropertyNames(leg).includes("steps"))
                .forEach(leg => leg['steps'].forEach(step =>
                {
                    // console.log(step.start_location);
                    // positions.routes.push(step.start_location);
                    // positions.routes.push(step.end_location);
                    positions.polyline.push(...decode(step.polyline.points));
                }));
            const twoPI = Math.PI * 2;
            const rad2Deg = 57.2957795130823209;
            let angle = 0;
            let counter = -1;
            for (let i = 0; i < positions.polyline.length - 2; i++)
            {
                if (positions.polyline[i] !== positions.polyline[i + 1] || i === 0)
                {
                    let theta = Math.atan2(positions.polyline[i + 2].lat - positions.polyline[i].lat,
                        positions.polyline[i].lng - positions.polyline[i + 2].lng)
                    console.log(theta);

                    if (theta < 0.0)
                    {
                        theta += twoPI;
                    }
                    angle = rad2Deg * theta;

                    console.log(angle);

                    let imgUrl = "https://maps.googleapis.com/maps/api/streetview?size=1200x720&location=";
                    let elseUrl = `&heading=${angle - 90}&key=AIzaSyAfa6HsPmjDkkaeZGEzGhXUh6gMyMmUnc4`;
                    imgUrl = imgUrl + positions.polyline[i].lat + ',' + positions.polyline[i].lng + elseUrl;
                    counter++;
                    imgUrls.push(imgUrl);
                    // download(imgUrl, `assets/pics/st_${pad(counter + 1, 3)}.jpg`, function ()
                    // {
                    //     console.log('done');
                    // });
                }
            }


            response.json(positions);
            downloadImgs(imgUrls)

        })

});

function downloadImgs(imgUrls)
{
    let q = async.queue(function (task, callback)
    {
        rq.get(task.url)
            .on('response', function (response)
            {
                console.log(response.statusCode, response.headers['content-type']);
            })
            .on('error', function (err)
            {
                console.log('err')
                callback(err);
            })
            .pipe(fs.createWriteStream(task.path))
            .on('close', () =>
            {
                console.log('Image Downloaded');
                callback();
            });
    }, 80);

    q.drain = function ()
    {
        console.log('Im done here');
        compilee();
    };

    imgUrls.forEach((url, i) =>
    {
        path = `assets/pics/st_${pad(i + 1, 3)}.jpg`
        q.push({ url, path }, function (err)
        {
            if (err)
            {
                console.log(err);
            }
        });
    });
}

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

function compilee()
{
    command
        .on('end', onEnd)
        // .on('progress', onProgress)
        .on('error', onError)
        .input('assets/pics/st_%03d.jpg')
        .inputFPS(30)
        .output(__dirname + '/assets/demo/pepe.mp4')
        .outputFps(30)
        .noAudio()
        .run();
}

app.get('/api/video', (req, res) =>
{
    // res.writeHead(200, { 'Content-type': 'video/mp4' })
    // let rs = fs.createReadStream("assets/demo/meme.mp4");
    // rs.on('error', (err) => { console.log(err) })
    // rs.pipe(res);
    const path = 'assets/demo/pepe.mp4';
    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const range = req.headers.range;
    console.log(stat, fileSize, range)

    if (range)
    {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1
        const chunksize = (end - start) + 1
        const file = fs.createReadStream(path, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        }

        res.writeHead(206, head);
        file.pipe(res);
    }
    else
    {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(200, head);
        fs.createReadStream(path).pipe(res);
    }
});

app.post('/api/log', (req, response) =>
{
    console.log(req.body.value1, req.body.value2);
    url = `https://maps.googleapis.com/maps/api/directions/json?&origin=${req.body.value1.split(" ").join("+")}&destination=${req.body.value2.split(" ").join("+")}&key=AIzaSyAfa6HsPmjDkkaeZGEzGhXUh6gMyMmUnc4`;

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

// let download = (uri, filename, callback) =>
// {
//     request.head(uri, (err, res, body) =>
//     {
//         // console.log('content-type:', res.headers['content-type']);
//         // console.log('content-length:', res.headers['content-length']);
//         // console.log(err);
//         request(uri).on('error', (err) => { console.log('error') }).pipe(fs.createWriteStream(filename)).on('close', callback);
//     });
//     // request.get(uri, enc)
// };


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


let io = socket(server);

io.on('connection', (socket) =>
{
    console.log(socket.id, 'connected...')
    let playCount = 0;
    let pauseCount = 0;
    io.emit('log', { playCount, pauseCount });
    socket.on('play', () =>
    {
        playCount++;
        console.log('Play button pressed');
        io.emit('playCount', { playCount })
    });
    socket.on('pause', () =>
    {
        pauseCount++;
        console.log('Pause button pressed');
        io.emit('pauseCount', { pauseCount })
    })
    socket.on('disconnect', () =>
    {
        console.log(socket.id, 'disconnected...')
        io.emit('log', { playCount, pauseCount });
    })
});