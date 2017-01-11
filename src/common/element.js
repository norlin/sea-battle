import Log from 'common/log';
import Entity from 'common/entity.js';
import Utils from 'common/utils';
import Vector from 'common/vector';

let log = new Log('Element');

class Element extends Entity {
	constructor(game, options) {
		super(game, options);

		this.initParams();
	}

	initParams() {
		this.color = this.options.color || Utils.getRandomColor();
		this._position = this.options.start.copy();

		this.width = this.options.width || 1;
		this.height = this.options.height || 1;
	}

	pos() {
		return this._position.copy();
	}

	area() {
		return {
			left: this._position.x,
			top: this._position.y,
			x: this._position.x - this.width/2,
			y: this._position.y - this.height/2,
			w: this.width,
			h: this.height,
			id: this.id,
			type: this.type,
		};
	}

	getData(playerId) {
		if (this.dataToSend) {
			return this.dataToSend(playerId, {
				color: this.color
			});
		}

		return {
			color: this.color
		};
	}
}

export default Element;
