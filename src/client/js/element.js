import Element from 'common/element';
import Notify from './notify';
import Vector from 'common/vector';

class ClientElement extends Element {
	constructor(game, options) {
		super(game, options);

		this.initParams();
	}

	initParams() {
		super.initParams();

		this.hits = this.options.hits;
	}

	draw(canvas) {
		let screenPos;

		if (this.radius) {
			screenPos = this.game.toScreenCoords(this.pos());
			canvas.drawCircle(screenPos, this.radius, this.color);
		} else {
			let area = this.area();
			screenPos = this.game.toScreenCoords(new Vector(area.x, area.y));
			canvas.drawRect(screenPos, new Vector(area.w, area.h), this.color);
		}

		if (this.hits) {
			new Notify(this.game, {
				pos: screenPos,
				text: `-${Math.round(this.hits)}`,
				timeout: 1000
			});

			this.hits = undefined;
		}
	}

	tick() {}
}

export default ClientElement;
