import Log from 'common/log';
import Vector from 'common/vector';
import Element from './element';

let log = new Log('Field');

class ClientField extends Element {
	constructor(game, options) {
		super(game, options);

		this.initParams();
	}

	initParams() {
		super.initParams();

		this.cellSize = Math.round(this.width / this.game.config.fieldSize);
	}

	draw(canvas) {
		let screenPos;

		let area = this.area();
		this.drawGrid(canvas, area);

		screenPos = this.game.toScreenCoords(new Vector(area.x, area.y));
		canvas.drawRect(screenPos, new Vector(area.w, area.h), false, 2, this.game.config.gridColor);

		let fieldCenterScreen = this.game.toScreenCoords(new Vector(area.left, area.top));
		canvas.drawText(fieldCenterScreen, this.id, '#000');
	}

	drawGrid(canvas, area) {
		let start = this.game.toScreenCoords(new Vector(area.x, area.y));
		let end = start.copy().add({x: area.w, y: area.h});

		let ctx = canvas.ctx;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.game.config.gridColor;

		for (let x = start.x; x <= end.x; x += this.cellSize) {
			ctx.moveTo(x, start.y);
			ctx.lineTo(x, end.y);
		}

		for (let y = start.y; y <= end.y; y += this.cellSize) {
			ctx.moveTo(start.x, y);
			ctx.lineTo(end.x, y);
		}

		ctx.stroke();
	}

	tick() {}
}

export default ClientField;
