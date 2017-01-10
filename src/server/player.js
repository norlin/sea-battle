import Log from 'common/log';
import Vector from 'common/vector';
import Element from 'common/element';

let log = new Log('Player');

const SPEED_BASE = 6.25;
const SPEED_RETURN = 20;

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
		socket.on('setTarget', (point)=>{
			this._speed = SPEED_BASE;

			this.target = new Vector(point.x, point.y);
		});

		socket.removeAllListeners('stop');
		socket.on('stop', (point)=>{
			let id = this.fields[0];
			let field = this.game.fields[id];

			if (field) {
				this._speed = SPEED_RETURN;
				this.target = field.pos();
			} else {
				this.target = this._position.copy();
			}
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

		this._speed = SPEED_BASE;

		let fields = [
		];

		fields.forEach((field)=>{
			this[field] = this.options[field];
		});
	}

	move() {
		if (!this.target) {
			return;
		}

		let compare = this.pos().sub(this.target);
		if (Math.abs(compare.x) < this._speed && Math.abs(compare.y) < this._speed) {
			this.stopMovement();

			return;
		}

		let target = this.target.copy().sub(this._position);

		if (!target.x && !target.y) {
			return;
		}

		let dist = target.magnitude();
		let delta = target.fromSelfAngle(this._speed);

		let radius = this.radius;
		let deltaDist = dist / (50 + radius);

		if (dist < (50 + radius)) {
			delta.multBy(deltaDist);
		}

		this._position.add(delta);

		/*let width = this.game.config.width;
		let height = this.game.config.height;

		// jump behind the edges
		if (this._position.x <= 0) {
			this._position.x = width-1;
			this.target.x = width + this.target.x;
		} else if (this._position.x >= width) {
			this._position.x = 1;
			this.target.x = this.target.x - width;
		}

		if (this._position.y <= 0) {
			this._position.y = height-1;
			this.target.y = height + this.target.y;
		} else if (this._position.y >= height) {
			this._position.y = 1;
			this.target.y = this.target.y - height;
		}*/
	}

	stopMovement() {
		if (this.target && this.target.isEqual(this._position)) {
			this.target = null;
			this._speed = SPEED_BASE;
			return;
		}

		this.target = this._position.copy();
	}

	tick() {
		this.move();
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

		let offset = 320;

		return {
			left: pos.x - half.x - offset,
			right: pos.x + half.x + offset,
			top: pos.y - half.y - offset,
			bottom: pos.y + half.y + offset
		};
	}
}

export default Player;
