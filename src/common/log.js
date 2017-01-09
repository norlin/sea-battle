let logs = [];

var verboseLevel = 1;

const LEVELS = [
	'NONE',
	'DEBUG',
	'INFO',
	'WARN',
	'ERROR',
	'CRIT'
];

class Log {
	constructor(module, verbose) {
		this.module = module;

		if (typeof(verbose) == 'number') {
			this.verbose = verbose;
		}
	}

	setVerbose(level) {
		if (this.verbose) {
			this.verbose = level;
		}
	}

	setGlobalVerbose(level) {
		verboseLevel = level;
	}

	_log(level, ...msg) {
		let verbose = this.verbose || verboseLevel;

		if (!verbose || (level < verbose)) {
			return;
		}

		let levelName = LEVELS[level];
		let message = [`[${this.module}/${levelName}]`].concat(msg);
		logs.push(message.join(' '));

		let method = level < 5 ? LEVELS[level].toLowerCase() : 'error';
		if (!console[method]) {
			method = 'log';
		}

		console[method].apply(console, message);
	}
}

// Create level-specific methods

for (let i = 1; i < LEVELS.length; i += 1) {
	let levelName = LEVELS[i].toLowerCase();

	Log.prototype[levelName] = (function(level){
		return function(...msg) {
			this._log.apply(this, [level].concat(msg));
		};
	}(i));
}

export default Log;
