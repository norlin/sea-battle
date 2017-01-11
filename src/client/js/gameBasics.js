import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Entity from 'common/entity.js';
import Keys from './keys';
import Canvas from './canvas';

let log = new Log('basics');

class GameBasics extends Entity {
	constructor(options) {
		super(null, options);

		this.objects = {};
		this.objectsUI = {};
		this.sectors = [];

		this.debug = false;

		this.viewpoint = new Vector();

		this.initCanvas();
	}

	init(config) {
		this.config = config;

		log.debug(config);

		this.addKeyListener(Keys.ENTER, ()=>{
			if (this.tickTimer) {
				this.stop();
			} else {
				this.start();
			}
		}, null, true);

		this.addKeyListener(Keys.TAB, ()=>{
			this.debug = !this.debug;
		}, null, true);

		this.start();
	}

	initCanvas() {
		let el = document.getElementById(this.options.canvas);

		if (!el) {
			throw 'No canvas found!';
		}

		this.updateScreen();

		this.canvas = new Canvas(this, {
			canvas: el,
			size: this.screen.copy(),
			background: '#fff'
		});

		document.body.addEventListener('keydown', (e)=>this.onKeyDown(e), true);
		document.body.addEventListener('keyup', (e)=>this.onKeyUp(e), true);
		document.body.addEventListener('click', (e)=>this.onClick(e), true);
		document.body.addEventListener('mousedown', (e)=>this.onMouseDown(e), true);
		document.body.addEventListener('mouseup', (e)=>this.onMouseUp(e), true);
		document.body.addEventListener('mousemove', (e)=>this.onMove(e), true);

		window.addEventListener('resize', ()=>this.updateScreen());

		this.direction = 0;
	}

	updateScreen() {
		this.screen = new Vector(document.body.offsetWidth, document.body.offsetHeight);
		this.center = this.screen.copy().divBy(2);

		if (this.canvas) {
			this.canvas.updateSize(this.screen);
		}
	}

	onKeyDown(event) {
		let code = event.which;

		event.preventDefault();

		this.emit(`keydown.${code}.global`);

		if (this.tickTimer) {
			this.emit(`keydown.${code}`);
		}
	}

	onKeyUp(event) {
		let code = event.which;

		event.preventDefault();

		this.emit(`keyup.${code}.global`);

		if (this.tickTimer) {
			this.emit(`keyup.${code}`);
		}
	}

	onMove(event) {
		let {point, gamePoint} = this.getMousePoint(event);

		this.emit(`mousemove.global`, point);
		if (this.tickTimer) {
			this.emit(`mousemove`, point);
		}

		this.emit(`gameMousemove`, gamePoint);

		this.direction = this.center.directionTo(point);
	}

	getMousePoint(event) {
		let mouse = new Vector(event.clientX, event.clientY);
		let point = mouse.sub(this.center);

		let pos = this.viewpoint.copy();
		let gamePoint = pos.add(point);

		return {point, gamePoint};
	}

	onClick(event) {
		event.preventDefault();

		let {point, gamePoint} = this.getMousePoint(event);

		this.emit(`click.global`, point);

		if (this.tickTimer) {
			this.emit(`click`, point);
		}

		this.emit(`gameClick`, gamePoint);
	}

	onMouseDown(event) {
		event.preventDefault();

		let {point, gamePoint} = this.getMousePoint(event);

		this.emit(`mousedown.global`, point);

		if (this.tickTimer) {
			this.emit(`mousedown`, point);
		}

		this.emit(`gameMousedown`, gamePoint);
	}

	onMouseUp(event) {
		event.preventDefault();

		let {point, gamePoint} = this.getMousePoint(event);

		this.emit(`mouseup.global`, point);

		if (this.tickTimer) {
			this.emit(`mouseup`, point);
		}

		this.emit(`gameMouseup`, gamePoint);
	}

	addKeyListener(keys, handlerDown, handlerUp, global) {
		let isGlobal = global ? '.global' : '';
		if (!Array.isArray(keys)) {
			keys = [keys];
		}
		keys.forEach((key)=>{
			if (handlerDown) {
				this.on(`keydown.${key}${isGlobal}`, handlerDown);
			}
			if (handlerUp) {
				this.on(`keyup.${key}${isGlobal}`, handlerUp);
			}
		});
	}

	addClickListener(handler, inGame, global) {
		let event = inGame ? 'gameClick' : 'click';
		let isGlobal = global ? '.global' : '';

		this.on(`mousedown${isGlobal}`, handler);
	}

	addMouseListener(handlerDown, handlerUp, inGame, global) {
		let event = inGame ? 'gameMouse' : 'mouse';
		let isGlobal = global ? '.global' : '';

		if (handlerDown) {
			this.on(`${event}down${isGlobal}`, handlerDown);
		}
		if (handlerUp) {
			this.on(`${event}up${isGlobal}`, handlerUp);
		}
	}

	addMouseMoveListener(handler, inGame, global) {
		let event = inGame ? 'gameMouse' : 'mouse';
		let isGlobal = global ? '.global' : '';

		this.on(`${event}move${isGlobal}`, handler);
	}

	drawGrid() {
		let size = this.options.gridSize || 32;
		let step = new Vector(size, size);
		let init = new Vector(-this.viewpoint.x, -this.viewpoint.y);

		let ctx = this.canvas.ctx;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.config.gridColor;

		for (let x = init.x; x < this.screen.x; x += step.x) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, this.screen.y);
		}

		for (let y = init.y; y < this.screen.y; y += step.y) {
			ctx.moveTo(0, y);
			ctx.lineTo(this.screen.x, y);
		}

		ctx.stroke();
	}

	drawBorder() {
		let options = this.options;
		let config = this.config;

		let viewpoint = this.viewpoint;

		let ctx = this.canvas.ctx;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.config.borderColor;

		let leftTop = this.center.copy().sub(viewpoint);

		// Left
		if (viewpoint.x <= this.center.x) {
			ctx.moveTo(leftTop.x, leftTop.y);
			ctx.lineTo(leftTop.x, config.height + leftTop.y);
		}

		// Top
		if (viewpoint.y <= this.center.y) {
			ctx.moveTo(leftTop.x, leftTop.y);
			ctx.lineTo(config.width + leftTop.x, leftTop.y);
		}

		// Right
		if (config.width - viewpoint.x <= this.center.x) {
			ctx.moveTo(config.width + leftTop.x, leftTop.y);
			ctx.lineTo(config.width + leftTop.x, config.height + leftTop.y);
		}

		// Bottom
		if (config.height - viewpoint.y <= this.center.y) {
			ctx.moveTo(config.width + leftTop.x, config.height + leftTop.y);
			ctx.lineTo(leftTop.x, config.height + leftTop.y);
		}

		ctx.stroke();
	}

	toScreenCoords(vector) {
		let point = vector.copy();
		let view = this.viewpoint;
		let corr = view.copy().sub(this.center);

		/*if (corr.x+this.screen.x > this.config.width && point.x < this.screen.x && point.x < corr.x) {
			point.x += this.config.width;
		} else if (corr.x < this.screen.x && point.x > corr.x && point.x+this.screen.x > this.config.width) {
			point.x -= this.config.width;
		}

		if (corr.y+this.screen.y > this.config.height && point.y < this.screen.y && point.y < corr.y) {
			point.y += this.config.height;
		} else if (corr.y < this.screen.y && point.y > corr.x && point.y+this.screen.y > this.config.height) {
			point.y -= this.config.height;
		}*/

		return point.sub(corr);
	}

	iterate(method, objects) {
		objects = objects || this.objects;

		for (let id in objects) {
			method(objects[id]);
		}
	}

	iterateUI(method) {
		return this.iterate(method, this.objectsUI);
	}

	add(object, ui) {
		if (!object) {
			throw "What should I add?";
		}

		let objects = ui ? this.objectsUI : this.objects;

		if (objects[object.id]) {
			log.debug('object already in the game');
			return false;
		}

		objects[object.id] = object;

		return true;
	}

	remove(id, ui) {
		let objects = ui ? 'objectsUI' : 'objects';

		if (!this[objects][id]) {
			return;
		}

		this[objects][id] = undefined;
		delete this[objects][id];
	}

	start() {
		if (this.tickTimer) {
			return;
		}

		this.tickTimer = window.setInterval(()=>this.tick(), 1000 / this.config.fps);
	}

	stop() {
		if (this.tickTimer) {
			window.clearInterval(this.tickTimer);
			this.tickTimer = undefined;
		}
	}

	drawObjects() {
		this.iterate((object)=>this.canvas.add(object));
	}

	tick() {
		this.canvas.clear();

		this.iterate((object)=>{
			if (object.tick) {
				object.tick();
			}
		});

		this.drawGrid();
		this.drawBorder();

		this.drawObjects();

		this.iterateUI((object)=>this.canvas.add(object));
	}
}

export default GameBasics;
