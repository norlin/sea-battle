import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Entity from 'common/entity';
import Player from './player';
import Field from './field';
import QuadTree from 'simple-quadtree';

let log = new Log('Game');

class Game extends Entity {
	constructor(options, io) {
		super(null, options);

		this.config = this.options;
		this.sockets = {};
		this.players = {};

		this.objects = {};

		let width = this.config.width;
		let height = this.config.height;

		this.map = this.makeMap();

		this.tree = QuadTree(0, 0, width, height);
		this.fields = {};

		this.addListeners(io);
		this.start();
	}

	makeMap() {
		let map = [];
		let size = this.options.gridSize || 32;
		let width = Math.floor(this.config.width / size);
		let height = Math.floor(this.config.height / size);

		for (let x = 0; x < width; x += 1) {
			let col = map[x] = map[x]||[];

			for (let y = 0; y < height; y += 1) {
				let cell = Utils.randomInRange(0, 20);
				if (cell < 17) {
					col.push(0);
				} else if (cell == 17) {
					col.push(1);
				} else if (cell == 18) {
					col.push(2);
				} else if (cell == 19) {
					col.push(3);
				}
			}
		}

		return map;
	}

	add(object) {
		if (!object) {
			log.error('What I should add?');
			return false;
		}

		if (this.objects[object.id]) {
			log.error('Already added!');
			return false;
		}

		this.objects[object.id] = object;

		return true;
	}

	remove(id) {
		if (!id) {
			log.error('What I should remove?');
			return false;
		}

		if (!this.objects[id]) {
			return false;
		}

		if (this.players[id]) {
			this.players[id].die();
			this.players[id] = undefined;
			delete this.players[id];
		}

		if (this.fields[id]) {
			this.fields[id] = undefined;
			delete this.fields[id];
		}

		this.objects[id].destroy();
		this.objects[id] = undefined;
		delete this.objects[id];

		return true;
	}

	disconnectPlayer(id) {
		let socket = this.sockets[id];
		if (socket) {
			// TODO: unify with player.die()
			socket.emit('died');
			this.sockets[id] = undefined;
			delete this.sockets[id];
		}

		let player = this.objects[id];

		if (!player) {
			log.error('No player found with id', id);
			return false;
		}

		player.fields.forEach(field=>this.remove(field));

		this.players[id] = undefined;
		delete this.players[id];

		if (!this.objects[id]) {
			return false;
		}
		this.objects[id] = undefined;
		delete this.objects[id];
	}

	addListeners(io) {
		io.on('connection', (socket)=>this.connection(socket));
	}

	connection(socket) {
		log.debug('A user connected!', socket.id);

		this.sockets[socket.id] = socket;

		socket.on('start', (data)=>this.onStart(socket, data));
		socket.on('disconnect', ()=>{
			log.debug('User disconnected', socket.id);

			this.disconnectPlayer(socket.id);
		});

		socket.emit('config', this.config);
	}

	onStart(socket, data) {
		let playerId = socket.id;

		if (this.players[playerId]) {
			return;
		}

		let basicPower = 1;

		let fieldId = this.addField(playerId);

		if (!fieldId) {
			socket.emit('full');
			socket.disconnect();
			return;
		}

		let fieldPos = this.fields[fieldId].pos();

		let player = new Player(this, socket, {
			id: playerId,
			screen: new Vector(data.screenWidth, data.screenHeight),
			start: fieldPos,
			fields: [fieldId],
		});

		if (playerId != player.id) {
			throw new Error('Player id mismatch!');
		}

		this.players[player.id] = player;

		this.add(player);
	}

	start() {
		if (this.tickTimer) {
			return;
		}

		this.tickTimer = setInterval(()=>this.tick(), 1000 / this.config.fps);
	}

	stop() {
		if (this.tickTimer) {
			clearInterval(this.tickTimer);
			this.tickTimer = undefined;
		}
	}

	getVisibleObjects(id, area) {
		var objects = {};

		let player = this.players[id];
		let currentPos;
		if (player) {
			currentPos = player.pos();
		}

		this.iterate((object)=>{
			if (object.id == id || object.invisible) {
				// skip current player
				return;
			}

			let pos = object.pos && object.pos();

			if (!pos) {
				return;
			}

			if (object.type=='field') {
				let obj = object.area();
				obj.right = obj.left + obj.w;
				obj.bottom = obj.top + obj.h;

				if ((obj.left > area.left && obj.left < area.right ||
					obj.right < area.right && obj.right > area.left) &&
					(obj.top > area.top && obj.top < area.bottom ||
					obj.bottom < area.bottom && obj.bottom > area.top)
				) {
					objects[object.id] = {
						id: object.id,
						x: pos.x,
						y: pos.y,
						w: obj.w,
						h: obj.h,
						data: object.getData(id),
						type: object.type
					};
				}
				return;
			}
			/*
			let radius = object.radius || 0;

			let inArea = {
				x: false,
				y: false
			};

			let left = pos.x + radius;
			let right = pos.x - radius;
			let top = pos.y + radius;
			let bottom = pos.y - radius;

			if (area.left > area.right) {
				inArea.x = ((left > area.left) && (right < this.config.width)) || ((left > 0) && (right < area.right));
			} else {
				inArea.x = (left > area.left) && (right < area.right);
			}
			if (area.top > area.bottom) {
				inArea.y = ((top > area.top) && (bottom < this.config.height)) || ((top > 0) && (bottom < area.bottom));
			} else {
				inArea.y = (top > area.top) && (bottom < area.bottom);
			}

			if (inArea.x && inArea.y) {
				objects[object.id] = {
					id: object.id,
					x: pos.x,
					y: pos.y,
					data: object.getData(),
					type: object.type
				};

				if (object.hits) {
					objects[object.id].hits = object.hits;
				}
			} else if (object.type == 'player' && currentPos) {
				let direction = currentPos.directionTo(pos);

				objects[object.id] = {
					id: object.id,
					direction: direction,
					color: object.color
				};
			}
			*/
		});

		return objects;
	}

	iterate(method) {
		for (let id in this.objects) {
			method(this.objects[id]);
		}
	}

	tick() {
		this.tree.clear();

		// move objects
		this.iterate((object)=>{
			if (object._needRemove) {
				this.remove(object.id);
				return;
			}

			if (object.tick) {
				object.tick();
			}

			if (object._position && !object.invisible) {
				this.tree.put(object.area());
			}
		});

		/*// check collisions
		this.iterate((object)=>{

		});*/

		// update clients
		this.iterate((object)=>{
			if (object.updateClient) {
				object.updateClient();
			}
		});
	}

	getFieldByPos(pos) {
		let field = this.tree.get({
			x: pos.x,
			y: pos.y,
			w: 1,
			h: 1,
			type: 'field'
		});

		if (!field || !field.length) {
			return;
		}

		if (field.length > 1) {
			throw new Error('Multiple fields by pos');
		}

		return field[0];
	}

	getField(pos) {
		let id = Utils.buildFieldId(pos);
		return this.fields[id];
	}

	addField(playerId) {
		// TODO: find closest free position
		let pos;
		let x = 0;
		let y = 0;
		let previousDirection;

		function setPos(point) {
			pos = point;
		}

		if (!this.getField({x, y})) {
			setPos({x, y});
		} else {
			let d = 1;
			while (!pos) {
				for (let i = 0; i < d + 1; i++) {
					let point = {
						x: x - d + i,
						y: y - i
					};

					if (!this.getField(point)) {
						setPos(point);
						break;
					}

					point = {
						x: x + d - i,
						y: y + i
					};

					if (!this.getField(point)) {
						setPos(point);
						break;
					}
				}

				if (pos) {
					break;
				}

				for (let i = 1; i < d; i++) {
					let point = {
						x: x - i,
						y: y + d - i
					};

					if (!this.getField(point)) {
						setPos(point);
						break;
					}

					point = {
						x: x + d - i,
						y: y - i
					};

					if (!this.getField(point)) {
						setPos(point);
						break;
					}
				}

				if (pos) {
					break;
				}

				d += 1;
			}
		}

		let field = new Field(this, {
			pos: pos,
			player: playerId
		});
		this.fields[field.id] = field;
		this.add(field);

		return field.id;
	}
}

export default Game;
