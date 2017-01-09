import express from 'express';
import socket from 'socket.io';
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
		let game = new Game(this.config, io);
	}
}

export default Server;
