const express = require('express');

const app = express();
const port = 5000;



app.get('/api/', (req, res) =>
{
	res.sendFile('views/test.html', { root: __dirname });
});

app.listen(port, () => { console.log(`Server started on port ${port}`); });