import Utils from 'common/utils';
import Log from 'common/log';
import Vector from 'common/vector';
import Element from './element';

let log = new Log('Field');

class ClientField extends Element {
	constructor(game, options) {
		super(game, options);

		this.initParams();

		this.type = 'field';

		this.game.addMouseMoveListener((gamePoint)=>{
			let area = this.area();

			let hovered = Utils.posToField(gamePoint, this.width);

			if (hovered == this.id) {
				this.point = gamePoint.copy();
				this.cell = Utils.cellByPos(gamePoint, this.width, this.cellSize);
			} else {
				this.point = null;
			}
		}, true);

		this.game.addClickListener((gamePoint)=>{
			let hovered = Utils.posToField(gamePoint, this.width);

			if (hovered == this.id) {
				let cell = Utils.cellByPos(gamePoint, this.width, this.cellSize);
				this.game.player.fire(hovered, cell);
			}
		}, true);
	}

	initParams() {
		super.initParams();
		this.update(this.options);

		this.cellSize = Math.round(this.width / this.game.config.fieldSize);
	}

	draw(canvas) {
		let screenPos;

		let area = this.area();
		this.drawGrid(canvas, area);

		screenPos = this.game.toScreenCoords(new Vector(area.x, area.y));
		canvas.drawRect(screenPos, new Vector(area.w, area.h), false, 2, this.game.config.gridColor);

		let fieldCenterScreen = this.game.toScreenCoords(new Vector(area.left, area.top));
		//canvas.drawText(fieldCenterScreen, this.id, '#000');
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

		let size = new Vector(this.cellSize, this.cellSize).sub(2);
		if (!this.grid) {
			return;
		}

		this.grid.forEach((col, i)=>{
			let x = area.x + i * this.cellSize;
			col.forEach((item, j)=>{
				let {type, cell} = item;

				let pos = new Vector(x, area.y + j * this.cellSize);
				let screenPos = this.game.toScreenCoords(pos).add(1);

				let hovered = this.point && this.cell && this.cell.x == i && this.cell.y == j;
				let color = hovered ? '#ccf' : '#f7f7ff';

				switch (cell) {
				case 0:
					break;
				case 1:
					color = hovered ? '#fcc' : '#f88';
					break;
				case 2:
					if (this.game.debug) {
						color = '#fec';
					}
					break;
				case 3:
					color = '#f00';
					break;
				case 4:
					color = '#00f';
					break;
				}

				canvas.drawRect(screenPos, size, color);

				if (this.game.debug) {
					canvas.drawText(screenPos.add(this.cellSize/2), type, '#000');
				}
			});
		});
	}

	update(object) {
		this.grid = object.grid;
		this.hovered = object.hovered;
	}

	tick() {}
}

export default ClientField;
