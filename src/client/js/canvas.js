import Log from 'common/log';
import Vector from 'common/vector';
import Entity from 'common/entity.js';

let log = new Log('Canvas');

class Canvas extends Entity {
	constructor(game, options) {
		super(game, options);

		this.size = options.size;

		this.canvas = this.options.canvas;
		this.updateSize(this.size);

		this.init();
	}

	updateSize(size) {
		this.size = size;
		this.center = this.size.copy().divBy(2);

		this.canvas.width = this.size.x;
		this.canvas.height = this.size.y;
	}

	init() {
		if (!this.canvas) {
			throw 'No canvas found!';
		}

		this.pi2 = 2 * Math.PI;
		this.ctx = this.canvas.getContext('2d');
		this.setBackgroundColor(this.options.background);
	}

	clear() {
		this.ctx.clearRect(0, 0, this.size.x, this.size.y);
	}

	add(object) {
		if (!object.draw) {
			return;
		}

		object.draw(this);
	}

	setBackgroundColor(color) {
		this.bg = color;

		this.canvas.style.background = this.bg;
	}

	drawCircle(pos, radius, color) {
		let ctx = this.ctx;

		ctx.beginPath();
		ctx.arc(pos.x, pos.y, radius, 0, this.pi2, false);
		ctx.fillStyle = color;
		ctx.fill();
	}

	strokeCircle(pos, radius, color, width) {
		let ctx = this.ctx;

		ctx.beginPath();
		ctx.arc(pos.x, pos.y, radius, 0, this.pi2, false);
		ctx.lineWidth = width || 3;
		ctx.strokeStyle = color;
		ctx.stroke();
	}

	drawRect(pos, size, color, stroke, strokeColor) {
		let ctx = this.ctx;

		ctx.fillStyle = color;
		ctx.fillRect(pos.x, pos.y, size.x, size.y);

		if (stroke) {
			ctx.lineWidth = stroke;
			ctx.strokeStyle = strokeColor || '#000';

			pos = pos.copy();
			pos.add(stroke);

			size = size.copy();
			size.sub(stroke*2);

			ctx.strokeRect(pos.x, pos.y, size.x, size.y);
		}
	}

	drawText(pos, text, color) {
		let ctx = this.ctx;

		ctx.font = '12px Arial';
		ctx.fillStyle = color || '#000';
		ctx.fillText(text, pos.x, pos.y);
	}

	drawLine(options) {
		let from = options.from;
		let to = options.to;

		if (!to) {
			let angle = options.angle;
			let distance = options.distance || 100;

			to = from.copy().move(angle, distance);
		}

		let color = options.color;
		let width = options.width;
		let solid = options.solid;

		let ctx = this.ctx;

		ctx.beginPath();
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(to.x, to.y);
		if (!solid) {
			ctx.setLineDash([5]);
		}
		ctx.lineWidth = width || 1;
		ctx.strokeStyle = color || '#000';
		ctx.stroke();
		ctx.setLineDash([]);
	}

	drawImage(image, tile, pos) {
		this.ctx.drawImage(image, tile[0]+1, tile[1]+1, 30, 30, pos.x, pos.y, 32, 32);
	}
}

export default Canvas;
