import express from 'express';
import socket from 'socket.io';
import * as HTTP from 'http';
import Log from 'common/log';

const log = new Log('Monitor');

class Monitor {
	constructor(_config) {
		let config = this.config = Object.assign({}, _config);

		const app = express();
		const http = HTTP.createServer(app);
		const io = socket(http);

		app.use('/js', express.static('build/client/js'));
		app.use('/css', express.static('build/client/css'));
		app.get('/', (req, res)=>this.graph(req, res));
		app.get('/data', (req, res)=>this.getData(req, res));

		http.listen({
			host: config.host,
			port: config.port
		}, function () {
			log.info(`Monitor listening on ${config.host}:${config.port}`);
		});

		this.start(io);
	}

	start(io) {
		this.game = null;
		this.data = {};

		io.on('connection', (socket)=>this.connection(socket));
	}

	connection(socket) {
		if (!socket.handshake.query || socket.handshake.query.type != 'game') {
			log.debug('Not a game!');
			socket.disconnect();
			return;
		}

		if (this.game) {
			throw new Error('A game was already connected!');
		}

		log.debug('A game connected!', socket.id);

		this.ts_now = Date.now();
		this.ts_start = process.hrtime();
		this.game = socket;

		socket.on('data', (data)=>this.onData(data));
		socket.on('disconnect', ()=>{
			log.debug('Game disconnected', socket.id);

			this.disconnect();
		});
	}

	disconnect() {
		this.game = null;
	}

	ts_parse(hrtime) {
		if (typeof(hrtime) == 'string') {
			hrtime = hrtime.split(',');
		}

		return ((+hrtime[0]) * 1e9 +hrtime[1]) / 1e6;
	}

	onData(data) {
		let name = data.name;
		if (!this.data[name]) {
			this.data[name] = [];
		}

		let saved = this.data[name];

		let value = this.ts_parse(data.value);
		let date = this.ts_parse(process.hrtime(this.ts_start));

		saved.push({
			ms: date,
			value: +value
		});

		if (saved.length > this.config.limit) {
			saved.shift();
		}
	}

	graph(req, res) {
		let html = `<!DOCTYPE html><html lang="en">
		<head>
			<meta charset="UTF-8" />
			<title>Game Monitor</title>
			<link rel="stylesheet" href="/css/monitor.css" />
			<link rel="stylesheet" href="/css/metricsgraphics.css" />

			<script src="/js/monitor.js"></script>
		</head>
		<body>
			<div id="target" class="monitor-chart">
				<div class="monitor-chart-legend"></div>
			</div>
		</body>
		</html>`;

		res.status(200).send(html);
	}

	getData(req, res) {
		let name = req.query.name;
		if (!name) {
			return res.status(400).send('No name in query!');
		}

		let data = this.data[name];
		if (!data) {
			return res.status(404).send(`No data found for ${name}!`);
		}

		return res.status(200).send(data);
	}
}

export default Monitor;
