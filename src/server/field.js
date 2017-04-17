import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Element from 'common/element';

let log = new Log('Field');

const SIZE = 320;
const DIRS = ['Z', 'N', 'E', 'S', 'W'];

const SHIPS = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
const CAN_RIGHT = 1;
const CAN_DOWN = 2;

const EMPTY_CELL = 0;
const HAS_SHIP = 1;
const NEAR_SHIP = 2;
const HAS_HIT = 3;
const HAS_MISSED = 4;

class Field extends Element {
	constructor(game, options) {
		if (!options.pos) {
			throw new Error('No position for field!');
		}

		let id = Utils.buildFieldId({
			x: options.pos.x,
			y: options.pos.y
		});

		options.id = id;
		let {x, y} = Utils.fieldToPos(id, SIZE);
		options.start = new Vector(x, y);
		options.width = SIZE;
		options.height = SIZE;

		super(game, options);

		this.player = this.options.player;
		this.type = 'field';
		this.size = this.game.config.fieldSize;

		this.clear();
		this.random();

		this.emptyGrid = this.getEmptyGrid();
	}

	dataToSend(playerId, additional) {
		let player = this.game.players[playerId];

		return Object.assign({
			x: this._position.x,
			y: this._position.y,
			hovered: player && player.hoveredField==this.id,
			//grid: this.grid
			grid: playerId==this.player ? this.grid : this.emptyGrid
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

	getEmptyGrid() {
		let size = this.size;
		let grid = [];

		for (let i = 0; i < size; i += 1) {
			let col = grid[i] = [];
			for (let j = 0; j < size; j += 1) {
				col.push({type: 0, cell: EMPTY_CELL});
			}
		}

		return grid;
	}

	clear() {
		this.grid = this.getEmptyGrid();
	}

	placeShip(ship) {
		let available = [];

		//log.debug(`Ship '${ship}' placement...`);

		this.grid.forEach((col, i)=>{
			col.forEach((cell, j)=>{
				let pos = this.isAvailable(ship, {i, j});

				if (pos) {
					available.push({i, j, pos});
				}
			});
		});

		if (!available.length) {
			throw new Error(`Can't place ship of size ${ship}!`);
		}

		//log.debug('Available positions:', available);

		let pos = Utils.randomInRange(0, available.length);
		pos = available[pos];

		//log.debug('Choosen positions:', pos);

		let direction = pos.pos;
		let canRight = !!(direction & CAN_RIGHT);
		let canDown = !!(direction & CAN_DOWN);

		if (canDown && canRight) {
			direction = Utils.randomBool() ? CAN_DOWN : CAN_RIGHT;
		} else {
			direction = canDown ? CAN_DOWN : canRight ? CAN_RIGHT : null;
		}

		if (!direction) {
			throw new Error(`Can't decide ship placement direction!`);
		}

		//log.debug(`Choosen direction: ${direction}`);

		let isDown = direction == CAN_DOWN;
		for (let k = -1; k<2; k += 1) {
			let i = (isDown ? pos.i : pos.j) + k;

			if (i < 0 || i >= this.size) {
				continue;
			}

			for (let m = -1; m<=ship; m += 1) {
				let j = (isDown ? pos.j : pos.i) + m;

				if (j < 0 || j >= this.size) {
					continue;
				}

				let x = isDown ? i : j;
				let y = isDown ? j : i;

				try {
					if (this.grid[x][y].cell == HAS_SHIP) {
						continue;
					}

					if (k !== 0 || m == -1 || m == ship) {
						this.grid[x][y] = {type: ship, cell: NEAR_SHIP};
					} else {
						//log.debug(`Ship '${ship}' placed: ${i}x${j}`);
						if (this.grid[x][y].cell!==EMPTY_CELL) {
							throw new Error(`Cell is not available! ${i}x${j}, ${this.grid[x][y].cell}`);
						}
						this.grid[x][y] = {type: ship, cell: HAS_SHIP};
					}
				} catch(e) {
					console.log(e);
					console.log(`k: ${k}, m: ${m}`);
				}
			}
		}
	}

	isAvailable(ship, pos) {
		let grid = this.grid;
		let {i, j} = pos;

		let res = EMPTY_CELL;

		let {cell} = grid[i][j];
		if (cell!==EMPTY_CELL) {
			return res;
		}

		// check right
		if (i+ship <= this.size) {
			let possible = true;

			for (let k = 0; k<ship; k += 1) {
				let p = i+k;

				let {cell} = grid[p][j];
				if (cell!==EMPTY_CELL) {
					possible = false;
					break;
				}
			}

			if (possible) {
				res = res | CAN_RIGHT;
			}
		}

		if (j+ship <= this.size) {
			let possible = true;

			for (let k = 0; k<ship; k += 1) {
				let p = j+k;

				let {cell} = grid[i][p];
				if (cell!==EMPTY_CELL) {
					possible = false;
					break;
				}
			}

			if (possible) {
				res = res | CAN_DOWN;
			}
		}

		return res;
	}

	random() {
		let timeout = 5000;
		let time = 0;
		SHIPS.forEach(ship=>{
			this.placeShip(ship);
			//this.timeout = setTimeout(()=>this.placeShip(ship), time+timeout);
			//time += timeout;
		});
	}

	destroy() {
		super.destroy();

		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
	}

	fire(cell) {
		let hit = this.grid[cell.x][cell.y].cell;

		if (hit === HAS_HIT || hit === HAS_MISSED) {
			return false;
		}

		if (hit === HAS_SHIP) {
			this.grid[cell.x][cell.y].cell = HAS_HIT;
		} else {
			this.grid[cell.x][cell.y].cell = HAS_MISSED;
		}

		this.emptyGrid[cell.x][cell.y].cell = this.grid[cell.x][cell.y].cell;

		return true;
	}
}

export default Field;
