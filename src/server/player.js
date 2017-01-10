import Log from 'common/log';
import Vector from 'common/vector';
import Element from 'common/element';

let log = new Log('Player');

class Player extends Element {
	constructor(game, socket, options) {
		super(game, options);

		this.type = 'player';

		this.socket = socket;
		this.screen = this.options.screen;

		this.fields = this.options.fields;

		this.listen();

		let data = this.dataToSend({
			id: this.id,
			color: this.color,
		});

		socket.emit('createPlayer', data);
	}

	listen() {
		let socket = this.socket;

		socket.removeAllListeners('setTarget');
		socket.on('click', (point)=>{
			// let target = new Vector(point.x, point.y);
		});
	}

	dataToSend(additional) {
		return Object.assign({
			x: this._position.x,
			y: this._position.y,
		}, additional);
	}

	initParams() {
		super.initParams();

		let fields = [
		];

		fields.forEach((field)=>{
			this[field] = this.options[field];
		});
	}

	tick() {
		// TODO: count 5 sec to end turn
	}

	die() {
		this.socket.emit('died');
	}

	updateClient() {
		let data = this.dataToSend();
		data.hits = this.hits;

		let area = this.viewport();
		data.area = area;
		data.visible = this.game.getVisibleObjects(this.id, area);

		this.socket.emit('update', data);
	}

	viewport() {
		let pos = this.pos();

		let half = this.screen.copy().divBy(2);

		let offset = 50;

		return {
			left: pos.x - half.x - offset,
			right: pos.x + half.x + offset,
			top: pos.y - half.y - offset,
			bottom: pos.y + half.y + offset
		};
	}
}

export default Player;
