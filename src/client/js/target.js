import Log from 'common/log';
import ClientElement from './element';

let log = new Log('Target');

class Target extends ClientElement {
	constructor(player, options) {
		super(player.game, options);

		this.color = this.options.color;
		this.player = player;
		this.maxRadius = 30;

		this.reset();
	}

	reset() {
		this.radius = this.maxRadius;
		this.direction = -1;
	}

	tick() {
		this.radius += this.direction * 1;

		if (this.radius <= 1) {
			this.radius = this.maxRadius;
		}
	}

	draw(canvas) {
		let screenPos = this.game.toScreenCoords(this.pos());

		this.game.canvas.strokeCircle(screenPos, this.radius, this.color, 1);
	}
}

export default Target;
