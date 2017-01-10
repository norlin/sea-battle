import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Keys from './keys';
import Socket from './connection';
import GameBasics from './gameBasics';
import ClientPlayer from './player';
import Element from './element';
import Field from './field';

let log = new Log('Game');

class Game extends GameBasics {
	constructor(options) {
		super(options);

		this.connect();

		this.loadAssets();
	}

	fillPlayerData(player, data) {
		let fields = [
			'fireCost',
			'firePower',
			'fireDistance',
			'maxHealth',
			'health',
			'maxEnergy',
			'energy',
			'maxPower',
			'power',
			'basicPower',
			'hits'
		];

		fields.forEach((field)=>{
			player[field] = data[field];
		});

		return player;
	}

	connect() {
		this.connection = Socket();
		this.socket = this.connection.socket;
		this.socket.on('config', (config)=>this.init(config));

		this.socket.on('createPlayer', (data)=>{
			if (this.player) {
				return;
			}

			let playerData = {
				id: data.id,
				name: 'test',
				color: data.color,
				start: new Vector(data.x, data.y),
				radius: data.radius
			};

			playerData = this.fillPlayerData(playerData, data);

			this.addPlayer(new ClientPlayer(this, this.socket, playerData));
		});

		this.socket.on('died', ()=>{
			this.onDie();
		});

		this.socket.on('update', (data)=>{
			this.area = data.area;

			this.area = {
				left: Utils.toMapTiles(this.area.left),
				right: Utils.toMapTiles(this.area.right),
				top: Utils.toMapTiles(this.area.top),
				bottom: Utils.toMapTiles(this.area.bottom)
			};

			this.player._position = new Vector(data.x, data.y);
			this.fillPlayerData(this.player, data);

			this.viewpoint = this.player.pos();

			let visible = data.visible;

			log.debug('visible', visible);

			this.iterate((object)=>{
				if (object._client) {
					// skip client-only object
					return;
				}

				let id = object.id;

				if (id == this.player.id) {
					// skip player object
					return;
				}

				if (!visible[id] || !visible[id].hasOwnProperty('x')) {
					this.remove(id);
				}
			});

			for (let id in visible) {
				let newObject = visible[id];
				let existing = this.objects[id];

				if (existing) {
					this.updateVisible(existing, newObject);
					continue;
				}

				this.addVisible(newObject);
			}
		});
	}

	addVisible(object) {
		switch (object.type) {
		case 'player':
		case 'object':
			let mass = new Element(this, {
				id: object.id,
				start: new Vector(object.x, object.y),
				radius: object.data.radius,
				color: object.data.color,
				hits: object.hits
			});

			this.add(mass);
			break;
		case 'field':
			let field = new Field(this, {
				id: object.id,
				start: new Vector(object.x, object.y),
				width: object.w,
				height: object.h
			});

			this.add(field);
			break;
		}
	}

	updateVisible(existing, object) {
		switch (existing.type) {
		case 'player':
		case 'object':
			existing._position = new Vector(object.x, object.y);
			existing.radius = object.data.radius;
			existing.color = object.data.color;
			break;
		}
	}

	addPlayer(player) {
		this.player = player;
		this.add(player);

		this.viewpoint = this.player.pos();
	}

	start() {
		let config = this.config;
		if (!config) {
			throw 'No config loaded!';
		}

		if (this.tickTimer) {
			return;
		}

		super.start();

		if (this.player) {
			return;
		}

		this.socket.emit('start', {
			screenWidth: this.screen.x,
			screenHeight: this.screen.y
		});
	}

	tick() {
		super.tick();

		if (this.player) {

		} else {
			this.canvas.drawText(this.center, 'No player');
		}
	}

	loadAssets() {
		let grass = new Image();
		grass.onload = ()=>{
			this.grass = grass;
		};
		grass.src = '/assets/grass.png';
	}

	drawBorder() {}

	drawGrid() {}

	onDie() {
		this.stop();
		this.remove(this.player.id);
		this.player = undefined;
		this.tick();
	}
}

export default Game;
