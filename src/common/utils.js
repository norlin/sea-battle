const uuidTemplate = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
const tileSize = 32;

const tiles = {
	'0': [1*32, 3*32],
	'1': [0*32, 5*32],
	'2': [1*32, 5*32],
	'3': [2*32, 5*32]
};

// `field_E:1xS:2
const fieldIdRx = /^field_([ZEW]):(\d+)x([ZNS]):(\d+)$/;

class Utils {
	uuid() {
		return uuidTemplate.replace(/[xy]/g, function(c) {
			let r = Math.random()*16|0;
			let v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	find(key, obj) {
		return key.split('.').reduce((o, i)=>o[i], obj);
	}

	valueInRange(min, max, value) {
		return Math.min(max, Math.max(min, value));
	}

	randomDouble(min, max) {
		return Math.random() * (max-min) + min;
	}

	randomInRange(min, max) {
		return Math.floor(this.randomDouble(min, max));
	}

	getRandomColor() {
		return '#'+((1<<24)*Math.random()|0).toString(16);
	}

	rgbToHex(r, g, b) {
		function toHex(c) {
			var hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		}

		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}

	hexToRgb(hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(m, r, g, b) {
			return r + r + g + g + b + b;
		});

		let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	hexToGL(hex) {
		let rgb = this.hexToRgb(hex);

		return rgb ? {
			r: rgb.r / 255,
			g: rgb.g / 255,
			b: rgb.b / 255
		} : null;
	}

	toMapTiles(value) {
		return Math.floor(value / tileSize);
	}

	getTile(index) {
		return tiles[index];
	}

	parseFieldId(id) {
		let coords = id.match(fieldIdRx);

		if (!coords) {
			throw new Error(`Wrong id: ${id}`);
		}

		let dirX = coords[1];
		let x = coords[2];
		if (dirX == 'W') {
			x = -1*x;
		}

		let dirY = coords[3];
		let y = coords[4];
		if (dirY == 'N') {
			y = -1*y;
		}

		return {x, y};
	}

	buildFieldId(pos) {
		let x, y, dirX, dirY;

		if (pos.x === 0) {
			x = 0;
			dirX = 'Z';
		} else if (pos.x < 0) {
			x = -1*pos.x;
			dirX = 'W';
		} else {
			x = pos.x;
			dirX = 'E';
		}

		if (pos.y === 0) {
			y = 0;
			dirY = 'Z';
		} else if (pos.y < 0) {
			y = -1*pos.y;
			dirY = 'N';
		} else {
			y = pos.y;
			dirY = 'S';
		}

		return `field_${dirX}:${x}x${dirY}:${y}`;
	}

	fieldToPos(id, size) {
		let {x, y} = this.parseFieldId(id);
		x = x*size;
		y = y*size;

		return {x, y};
	}
}

const instance = new Utils();

export default instance;
