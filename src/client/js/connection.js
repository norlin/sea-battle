import Log from 'common/log';
import { connect as io } from 'socket.io-client';

let log = new Log('Socket');

class Client {
	constructor(options) {
		this.options = Object.assign({}, options);

		this.socket = io({
			reconnection: false,
			query: 'type=player'
		});

		this.on = this.socket.on.bind(this.socket);
		this.emit = this.socket.emit.bind(this.socket);
		this.off = this.socket.off.bind(this.socket);
	}
}

let instance;

function create(game, options) {
	if (!instance) {
		instance = new Client(game, options);
	}

	return instance;
}

export default create;
