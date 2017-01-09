import Log from 'common/log';
import Vector from 'common/vector';
import Entity from 'common/entity';

class UIElement extends Entity {
	constructor(game, options) {
		super(game, options);

		this._position = this.options.pos || this.game.center.copy();

		this.game.add(this, 'ui');
	}

	pos() {
		return this._position.copy();
	}

	draw(canvas) {}

	hide() {
		this.game.remove(this.id, 'ui');
	}
}

export default UIElement;
