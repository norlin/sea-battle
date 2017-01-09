import Log from 'common/log';
import Vector from 'common/vector';
import UIElement from './ui';

class Panel extends UIElement {
	draw(canvas) {
		let size = new Vector(this.options.width, this.options.height);

		canvas.drawRect(this.pos(), size, this.options.color, 3);
	}
}

export default Panel;
