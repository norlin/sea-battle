/* globals require, __dirname */
const fs = require('fs');
import Log from 'common/log';
import Utils from 'common/utils';
import Entity from 'common/entity.js';

const shaders = {
	vertex: fs.readFileSync(__dirname+'/../shaders/vertex.vert', 'utf8'),
	fragment: fs.readFileSync(__dirname+'/../shaders/fragment.frag', 'utf8')
};

let log = new Log('Canvas');

class Canvas extends Entity {
	constructor(game, options) {
		super(game, options);

		this.canvas = this.options.canvas;
		this.width = this.options.width;
		this.height = this.options.height;

		this.init();
	}

	init() {
		let canvas = this.canvas;
		if (!canvas) {
			throw 'No canvas found!';
		}

		this.pi2 = 2 * Math.PI;
		let gl;

		try {
			// Try to grab the standard context. If it fails, fallback to experimental.
			gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		}
		catch(e) {}

		if (!gl) {
			let err = 'No WebGl context!';
			log.error(err);
			throw err;
		}

		this.ctx = gl;

		this.initShaders();
	}

	initShaders() {
		let canvas = this.canvas;
		let gl = this.ctx;

		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0, 0.5, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		let vert = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vert, shaders.vertex);
		gl.compileShader(vert);

		let frag = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(frag, shaders.fragment);
		gl.compileShader(frag);

		let program = gl.createProgram();
		gl.attachShader(program, vert);
		gl.attachShader(program, frag);
		gl.linkProgram(program);

		if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS))
			console.log(gl.getShaderInfoLog(vert));

		if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS))
			console.log(gl.getShaderInfoLog(frag));

		if (!gl.getProgramParameter(program, gl.LINK_STATUS))
			console.log(gl.getProgramInfoLog(program));

		this.program = program;

		let buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

		gl.useProgram(program);

		let resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
		gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
	}

	clear() {
		this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
	}

	add(object) {
		if (!object.draw) {
			return;
		}

		object.draw(this);
	}

	setBackgroundColor(color) {
		this.bg = color;

		this.canvas.style.background = this.bg;
	}

	drawCircle(x, y, radius, color) {
		// TODO: vectorize arguments!
		let ctx = this.ctx;

		ctx.beginPath();
		ctx.arc(x, y, radius, 0, this.pi2, false);
		ctx.fillStyle = color;
		ctx.fill();
	}

	drawRect(x, y, w, h, color) {
		// TODO: vectorize arguments!
		let gl = this.ctx;
		let program = this.program;

		let itemSize = 2;
		let vertices = new Float32Array([
			x, y, x+w, y, x+w, y+h, // Triangle 1
			x, y, x, y+h, x+w, y+h // Triangle 2
		]);

		let colorLocation = gl.getUniformLocation(program, 'uColor');
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		color = Utils.hexToGL(color);
		gl.uniform4f(colorLocation, color.r, color.g, color.b, 1);

		program.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
		gl.enableVertexAttribArray(program.aVertexPosition);
		gl.vertexAttribPointer(program.aVertexPosition, itemSize, gl.FLOAT, false, 0, 0);

		// Draw the rectangle.
		gl.drawArrays(gl.TRIANGLES, 0, vertices.length / itemSize);
	}

	drawText(x, y, text, color) {
		// TODO: vectorize arguments!
		let ctx = this.ctx;

		ctx.font = '12px Arial';
		ctx.fillStyle = color || '#000';
		ctx.fillText(text, x, y);
	}
}

export default Canvas;
