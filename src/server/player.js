import Utils from 'common/utils';
import Log from 'common/log';
import Vector from 'common/vector';
import Element from 'common/element';

let log = new Log('Player');

const SPEED_BASE = 10;
const RETURN_TIME = 0.5;

const SIZE = 320;

class Player extends Element {
	constructor(game, socket, options) {
		super(game, options);

		this.type = 'player';

		this.socket = socket;
		this.screen = this.options.screen;

		this.fields = this.options.fields;
		this.hoverField();

		this.listen();

		//this.ping();

		let data = this.dataToSend(this.id, {
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
			let field = this.game.fields[this.baseField] || this.game.fields[this.fields[0]];

			if (field) {
				this.target = field.pos();
				let dist = this.target.copy().sub(this._position).magnitude();
				this._speed = Math.max(SPEED_BASE, (dist/RETURN_TIME)/this.game.config.fps);
			} else {
				this.target = this._position.copy();
			}
		});
	}

	dataToSend(playerId, additional) {
		return Object.assign({
			x: this._position.x,
			y: this._position.y,
		}, additional);
	}

	initParams() {
		super.initParams();

		this._speed = SPEED_BASE;
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

		let radius = this.radius||1;
		let deltaDist = dist / (50 + radius);

		if (dist < (50 + radius)) {
			delta.multBy(deltaDist);
		}

		this._position.add(delta);

		this.hoverField();
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
		let data = this.dataToSend(this.id);
		data.hits = this.hits;

		let area = this.viewport();
		data.area = area;
		data.visible = this.game.getVisibleObjects(this.id, area);

		//const test = JSON.stringify(data);
		//log.debug(`Update data size: ${test.length}`);

		this.socket.emit('update', data);
	}

	viewport() {
		let pos = this.pos();

		let half = this.screen.copy().divBy(2);
		let offset = SIZE;

		return {
			left: pos.x - half.x - offset,
			right: pos.x + half.x + offset,
			top: pos.y - half.y - offset,
			bottom: pos.y + half.y + offset
		};
	}

	hoverField() {
		let id = Utils.posToField(this.pos(), SIZE);
		this.hoveredField = id;

		if (this.fields.indexOf(this.hoveredField)>-1) {
		//if (this.game.fields[this.hoveredField]) {
			this.baseField = this.hoveredField;
		}
	}
}

export default Player;
