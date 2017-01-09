import Log from 'common/log';
import Vector from 'common/vector';
import GameBasics from './gameBasics';
import Panel from './panel';

let log = new Log('Constructor');

class Constructor extends GameBasics {
	constructor(options) {
		super(options);

		this.init({
			width: 2000,
			height: 2000,
			fps: 60,
			borderColor: '#333',
			gridColor: '#ddd'
		});

		this.viewpoint = new Vector(this.config.width / 2, this.config.height / 2);

		this.makeUI();
	}

	makeUI() {
		let h = 100;
		this.panel = new Panel(this, {
			x: 0,
			y: this.options.screenHeight - h,
			width: this.options.screenWidth,
			height: h,
			color: '#ccc'
		});
	}

	tick() {
		super.tick();

		this.iterateUI((object)=>this.canvas.add(object));
	}
}

export default Constructor;
