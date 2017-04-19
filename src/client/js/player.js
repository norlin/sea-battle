import Log from 'common/log';
import Vector from 'common/vector';
import Element from './element';
import Keys from './keys';
import Target from './target';

let log = new Log('Player');

class ClientPlayer extends Element {
	constructor(game, socket, options) {
		super(game, options);

		this.socket = socket;
		this.dots = [];

		this.addListeners();
	}

	initParams() {
		super.initParams();

		this.game.fillPlayerData(this, this.options);
	}

	setKeyboardTarget() {
		let pos = this.pos();
		let movement = false;

		if (this._keyUP) {
			movement = true;
			pos.y -=  Number.MAX_VALUE;
		}
		if (this._keyDOWN) {
			movement = true;
			pos.y +=  Number.MAX_VALUE;
		}
		if (this._keyLEFT) {
			movement = true;
			pos.x -=  Number.MAX_VALUE;
		}
		if (this._keyRIGHT) {
			movement = true;
			pos.x +=  Number.MAX_VALUE;
		}

		if (movement) {
			this.socket.emit('setTarget', {
				x: pos.x,
				y: pos.y
			});
		} else {
			this.socket.emit('stop');
		}
	}

	addListeners() {
		this.socket.on('noEnergy', ()=>{
			log.info('No energy!');
		});

		// UP
		this.game.addKeyListener([Keys.UP, Keys.W], ()=>{
			this._keyUP = true;
			this.setKeyboardTarget();
		}, ()=>{
			this._keyUP = false;
			this.setKeyboardTarget();
		}, true);

		// DOWN
		this.game.addKeyListener([Keys.DOWN, Keys.S], ()=>{
			this._keyDOWN = true;
			this.setKeyboardTarget();
		}, ()=>{
			this._keyDOWN = false;
			this.setKeyboardTarget();
		}, true);

		// LEFT
		this.game.addKeyListener([Keys.LEFT, Keys.A], ()=>{
			this._keyLEFT = true;
			this.setKeyboardTarget();
		}, ()=>{
			this._keyLEFT = false;
			this.setKeyboardTarget();
		}, true);

		// RIGHT
		this.game.addKeyListener([Keys.RIGHT, Keys.D], ()=>{
			this._keyRIGHT = true;
			this.setKeyboardTarget();
		}, ()=>{
			this._keyRIGHT = false;
			this.setKeyboardTarget();
		}, true);

		this.game.addMouseListener(false, (point)=>{
			// on mouseup
		}, true);
	}

	tick() {}
	draw() {}

	fire(field, cell) {
		log.debug(`fire at ${field}->${cell.x}x${cell.y}!`);
		this.socket.emit('fire', {field, cell});
	}
}

export default ClientPlayer;
