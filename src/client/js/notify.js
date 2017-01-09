import Log from 'common/log';
import UIElement from './ui';

class Notify extends UIElement {
	constructor(game, options) {
		super(game, options);

		let timeout = typeof(this.options.timeout) == 'number' ? this.options.timeout : 5000;

		if (timeout) {
			this.timer = window.setTimeout(()=>this.hide(), timeout);
		}
	}

	draw(canvas) {
		canvas.drawText(this.pos(), this.options.text);
	}

	hide() {
		if (this.timer) {
			window.clearTimeout(this.timer);
			this.timer = undefined;
		}

		super.hide();
	}
}

export default Notify;
