import Element from 'common/element';
import Notify from './notify';

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
		let screenPos = this.game.toScreenCoords(this.pos());

		canvas.drawCircle(screenPos, this.radius, this.color);

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
