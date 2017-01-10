import Log from 'common/log';
import Vector from 'common/vector';
import Element from './element';
import Keys from './keys';
import Aim from './aim';
import Target from './target';

let log = new Log('Player');

class ClientPlayer extends Element {
	constructor(game, socket, options) {
		super(game, options);

		this.socket = socket;
		this.dots = [];

		this.addListeners();
	}

	initParams() {
		super.initParams();

		this.game.fillPlayerData(this, this.options);
	}

	addListeners() {
		this.socket.on('noEnergy', ()=>{
			log.info('No energy!');
		});

		this.game.addMouseListener(false, (point)=>{
			// on mouseup
		});
	}

	tick() {}
	draw() {}
}

export default ClientPlayer;
