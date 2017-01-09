import Log from 'common/log';
import Vector from 'common/vector';
import Element from './element';
import Keys from './keys';
import Aim from './aim';
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

		this.target = this.pos();
	}

	addListeners() {
		this.socket.on('noEnergy', ()=>{
			log.info('No energy!');
		});

		this.socket.on('fire', (data)=>{
			log.info('fire!', data.damage);
			this.energy = data.energy;
		});

		this.game.addMouseListener((point)=>{
			if (!this.aim) {
				this.launchFire();
			}
		}, (point)=>{
			if (this.aim) {
				this.launchFire();
			}
		});

		/* move by click
		this.game.addClickListener((point)=>{
			this.socket.emit('setTarget', point);
		}, true);

		this.game.addClickListener((point) => {
			this.target = new Vector(point.x, point.y);
		}, true);*/

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

		// FIRE
		this.game.addKeyListener(Keys['1'], (event)=>{
			if (!this.aim) {
				this.launchFire();
			}
		}, (event)=>{
			if (this.aim) {
				this.launchFire();
			}
		});
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

	launchFire() {
		if (this.aim) {
			// fire!
			this.socket.emit('launchFire', {
				direction: this.game.direction,
				radius: this.aim.radius
			});

			this.aim = undefined;

			return;
		}

		this.socket.emit('aimStart');
		this.aim = new Aim(this, {color: this.color});
	}

	updateTarget() {
		if (this.mark) {
			this.mark.reset();
			this.mark._position = this.target.copy();
		} else {
			this.mark = new Target(this, {
				start: this.target.copy(),
				color: this.color
			});
		}
	}

	stopMovement() {
		if (this.mark) {
			log.info('stopMovement');
			this.mark = undefined;
		}
	}

	tick() {
		// moves calculated on server

		let radius = this.radius;
		let pos = this.pos();
		pos.sub(this.target);

		if (Math.abs(pos.x) < radius && Math.abs(pos.y) < radius) {
			this.stopMovement();
		} else {
			if (this.mark) {
				this.mark._position = this.target.copy();

				this.mark.tick();
			} else {
				this.updateTarget();
			}
		}

		this.dots.forEach((dot, i)=>{
			if (dot.target) {
				dot.tick();
			} else {
				this.dots[i] = undefined;
			}
		});

		this.dots = this.dots.filter((dot)=>!!dot);

		if (this.aim) {
			this.aim.tick();
		}
	}

	draw(canvas) {
		super.draw(canvas);

		this.dots.forEach((dot)=>dot.draw(canvas));

		if (this.aim) {
			this.aim.draw(canvas);
		}

		if (this.mark) {
			this.mark.draw(canvas);
		}
	}
}

export default ClientPlayer;
