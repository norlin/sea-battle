import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Element from 'common/element';

let log = new Log('Field');

const SIZE = 320;
const DIRS = ['Z', 'N', 'E', 'S', 'W'];

class Field extends Element {
	constructor(game, options) {
		if (!options.pos) {
			throw new Error('No position for field!');
		}

		let id = Utils.buildFieldId({
			x: options.pos.x,
			y: options.pos.y
		});

		log.debug('New field', options.pos, id);

		options.id = id;
		let {x, y} = Utils.fieldToPos(id, SIZE);
		options.start = new Vector(x, y);
		options.width = SIZE;
		options.height = SIZE;

		super(game, options);

		this.type = 'field';
	}

	dataToSend(additional) {
		return Object.assign({
			x: this._position.x,
			y: this._position.y
		}, additional);
	}

	getNearbyFieldId(direction) {
		let id = this.id;
		let {x, y} = Utils.parseFieldId(this.id);

		switch (direction) {
		case 'N':
			y -= 1;
			break;
		case 'E':
			x += 1;
			break;
		case 'S':
			y += 1;
			break;
		case 'W':
			x -= 1;
			break;
		}

		return Utils.buildFieldId({x, y});
	}
}

export default Field;
