class Vector {
	constructor(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	add(vector) {
		if (typeof(vector) == 'number') {
			this.x += vector;
			this.y += vector;
		} else {
			this.x += vector.x;
			this.y += vector.y;
		}

		return this;
	}

	sub(vector) {
		if (typeof(vector) == 'number') {
			this.x -= vector;
			this.y -= vector;
		} else {
			this.x -= vector.x;
			this.y -= vector.y;
		}

		return this;
	}

	multBy(multiplier) {
		this.x *= multiplier;
		this.y *= multiplier;

		return this;
	}

	divBy(multiplier) {
		this.x /= multiplier;
		this.y /= multiplier;

		return this;
	}

	move(angle, distance) {
		let direction = Vector.fromAngle(angle, distance);
		this.add(direction);

		return this;
	}

	copy() {
		return new Vector(this.x, this.y);
	}

	isEqual(vector) {
		return this.x === vector.x && this.y === vector.y;
	}

	magnitude() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}

	angle() {
		return Math.atan2(this.y, this.x);
	}

	fromSelfAngle(magnitude) {
		return Vector.fromAngle(this.angle(), magnitude);
	}

	directionTo(vector) {
		return Math.atan2(vector.y - this.y, vector.x - this.x);
	}
}

Vector.fromAngle = function(angle, magnitude) {
	return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
};

export default Vector;
