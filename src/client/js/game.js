import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Keys from './keys';
import Socket from './connection';
import GameBasics from './gameBasics';
import ClientPlayer from './player';
import Element from './element';

let log = new Log('Game');

class Game extends GameBasics {
	constructor(options) {
		super(options);

		this.targetDirections = [];

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
		this.socket.on('map', (map)=>{
			console.log('got map', map);
			this.map = map;
		});

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

			this.mapArea = {
				left: Utils.toMapTiles(this.area.left),
				right: Utils.toMapTiles(this.area.right),
				top: Utils.toMapTiles(this.area.top),
				bottom: Utils.toMapTiles(this.area.bottom)
			};

			this.player.target = new Vector(data.targetX, data.targetY);
			this.player._position = new Vector(data.x, data.y);

			this.fillPlayerData(this.player, data);

			this.viewpoint = this.player.pos();

			let visible = data.visible;

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

				if (!visible[id] || !visible[id].x) {
					this.remove(id);
				}
			});

			this.targetDirections = [];

			for (let id in visible) {
				let newObject = visible[id];
				let existing = this.objects[id];

				if (newObject.direction) {
					this.targetDirections.push(newObject);
					continue;
				}

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
			log.debug('Add visible field', object);
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
			existing.hits = object.hits;
			break;
		case 'cloud':
			existing._position = new Vector(object.x, object.y);
			existing.radius = object.data.radius;
			existing.radiusMin = object.data.radiusMin;
			existing.count = object.data.count;
			existing.target = object.data.target;
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
			let pos = this.player.pos();
			let left = Math.floor(pos.x);
			let top = Math.floor(pos.y);

			this.canvas.drawText(new Vector(10, this.screen.y - 40), `Position: ${left} x ${top}`);
			this.canvas.drawText(new Vector(10, 20), `Health: ${Math.ceil(this.player.health)}/${this.player.maxHealth}`);
			this.canvas.drawText(new Vector(10, 40), `Energy: ${Math.floor(this.player.energy)}/${this.player.maxEnergy}`);

			if (this.debug) {
				let screenPos = this.toScreenCoords(pos);
				this.canvas.drawLine({
					from: screenPos,
					angle: this.direction,
					distance: 100,
					color: this.player.color,
					solid: true
				});

				this.canvas.drawText(new Vector(10, this.screen.y - 20), `Direction: ${this.direction * 180 / Math.PI}`);
			}
		} else {
			this.canvas.drawText(this.center, 'No player');
		}

		let rad45 = Math.PI/4;
		let rad90 = Math.PI/2;
		let rad135 = Math.PI - rad45;

		let targetWidth = 50;
		let targetOffset = 5;

		this.targetDirections.forEach((target)=>{
			let d = target.direction;
			let sector = d > -rad45 && d < rad45 ? 1 : (d >= rad45 && d < rad135 ? 2 : (d >= rad135 || d < -rad135 ? 3 : 4));

			let side;
			let length;

			let targetSize;

			switch (sector) {
			case 1: // right
				side = this.center.x - targetOffset;
				length = (side / Math.cos(d));
				targetSize = new Vector(0, targetWidth);
				break;
			case 2: // bottom
				side = this.center.y - targetOffset;
				length = (side / Math.sin(d));
				targetSize = new Vector(targetWidth, 0);
				break;
			case 3: // left
				side = this.center.x - targetOffset;
				length = (-side / Math.cos(d));
				targetSize = new Vector(0, targetWidth);
				break;
			case 4: // top
				side = this.center.y - targetOffset;
				length = (-side / Math.sin(d));
				targetSize = new Vector(targetWidth, 0);
				break;
			}

			let point = this.center.copy().move(d, length);
			targetSize.divBy(2);

			this.canvas.drawLine({
				from: point.copy().sub(targetSize),
				to: point.copy().add(targetSize),
				solid: true,
				color: target.color,
				width: 5
			});
		});
	}

	loadAssets() {
		let grass = new Image();
		grass.onload = ()=>{
			this.grass = grass;
		};
		grass.src = '/assets/grass.png';
	}

	drawGrid() {
		/*if (this.mapArea && this.grass && this.map) {
			return this.drawMap();
		}

		let size = this.options.gridSize || 32;
		let step = new Vector(size, size);
		let init = new Vector(-this.viewpoint.x, -this.viewpoint.y);

		let ctx = this.canvas.ctx;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.config.gridColor;

		for (let x = init.x; x < this.screen.x; x += step.x) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, this.screen.y);
		}

		for (let y = init.y; y < this.screen.y; y += step.y) {
			ctx.moveTo(0, y);
			ctx.lineTo(this.screen.x, y);
		}

		ctx.stroke();*/
	}

	drawMap() {
		let initX = this.mapArea.left;
		let initY = this.mapArea.top;
		let endX = this.mapArea.right;
		let endY = this.mapArea.bottom;

		let size = this.options.gridSize || 32;
		let step = new Vector(size, size);
		let init = new Vector(-this.viewpoint.x, -this.viewpoint.y);

		let ctx = this.canvas.ctx;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.config.gridColor;

		for (let x = initX; x < endX; x += 1) {
			let pos = this.toScreenCoords(new Vector(x*size, this.config.height));

			if (pos.x > 0 && pos.x < this.screen.x) {
				ctx.moveTo(pos.x, 0);
				ctx.lineTo(pos.x, this.screen.y);
			}
		}

		for (let y = initY; y < endY; y += 1) {
			let pos = this.toScreenCoords(new Vector(this.config.width, y*size));

			if (pos.y > 0 && pos.y < this.screen.y) {
				ctx.moveTo(0, pos.y);
				ctx.lineTo(this.screen.x, pos.y);
			}
		}

		ctx.stroke();

		/*for (let x = initX; x < endX; x += 1) {
			let col = this.map[x];
			let posX = x * 32;

			for (let y = initY; y < endY; y += 1) {
				let val = col[y];
				let posY = y * 32;

				let pos = this.toScreenCoords(new Vector(posX, posY));
				//if (pos.x<0 || pos.y<0) {
				//	console.log(`${x}x${y}`, `${posX}x${posY}`, `${pos.x}x${pos.y}`);
				//}
				let tile = Utils.getTile(val);

				this.canvas.drawImage(this.grass, tile, pos);
			}
		}*/
	}

	onDie() {
		this.stop();
		this.remove(this.player.id);
		this.player = undefined;
		this.tick();
	}
}

export default Game;
