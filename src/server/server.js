import express from 'express';
import socket from 'socket.io';
import { connect as io_client } from 'socket.io-client';
import * as HTTP from 'http';
import Log from 'common/log';
import Game from './game';

const log = new Log('Server');

class Server {
	constructor(_config) {
		let config = this.config = Object.assign({}, _config);

		const app = express();
		const http = HTTP.createServer(app);
		const io = socket(http);

		app.use(express.static('build/client'));
		app.use('/assets', express.static('build/assets'));

		http.listen({
			host: config.host,
			port: config.port
		}, function () {
			log.info(`Server listening on ${config.host}:${config.port}`);
		});

		this.createGame(io);
	}

	createGame(io) {
		let host = `http://${this.config.monitor.host}:${this.config.monitor.port}`;

		log.debug(`Connect to monitor ${host}`);

		let monitor = io_client.connect(host, {
			reconnection: false,
			query: 'type=game'
		});

		let game = new Game(this.config, io, monitor);
	}
}

export default Server;
