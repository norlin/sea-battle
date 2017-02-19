'use strict';

module.exports = function(grunt) {

grunt.initConfig({
	jshint: {
		options: {
			strict: 'implied',
			esversion: 6,
		},
		client: {
			options: {
				browser: true,
				globals: {
					console: true
				}
			},
			files: {
				src: [
					'src/common',
					'src/client'
				]
			},
		},
		server: {
			options: {
				node: true
			},
			files: {
				src: [
					'src/common',
					'src/server',
					'./index.js',
					'./monitor.js',
					'./config.js'
				]
			}
		}
	},
	browserify: {
		client: {
			options: {
				browserifyOptions: {
					debug: true,
					paths: ['./src']
				},
				transform: [['babelify', {presets: ['es2015']}], ['brfs']],
				plugins: ['transform-strict-mode']
			},
			files: [
				{
					nonull: true,
					cwd: 'src/',
					src: [
						'src/client/js/main.js',
					],
					dest: 'build/client/js/main.js'
				},
				{
					nonull: true,
					cwd: 'src/',
					src: [
						'src/client/js/monitor/monitor.js',
					],
					dest: 'build/client/js/monitor.js'
				},
			]
		},
	},
	babel: {
		server: {
			options: {
				presets: ['es2015'],
				sourceRoot: './src'
			},
			files: [
				{
					expand: true,
					cwd: 'src/',
					src: [
						'common/**/*.js',
						'server/**/*.js',
					],
					dest: 'build/'
				},
				{
					expand: true,
					cwd: './',
					src: [
						'index.js',
						'monitor.js',
						'config.js'
					],
					dest: 'build/'
				}
			]
		}
	},
	exorcise: {
		client: {
			options: {
				strict: true
			},
			files: {
				'build/client/js/main.map': ['build/client/js/main.js'],
				'build/client/js/monitor.map': ['build/client/js/monitor.js'],
			}
		}
	},
	copy: {
		html: {
			files: [
				{
					nonull: true,
					expand: true,
					cwd: 'src/',
					src: [
						'client/*.html',
						'assets/*.*',
					],
					dest: 'build/'
				}
			]
		},
		metrics: {
			files: [
				{
					nonull: true,
					expand: true,
					cwd: 'node_modules/metrics-graphics/dist/',
					src: ['*.css'],
					dest: 'build/client/css/'
				}
			]
		}
	},
	less: {
		options: {
			paths: ['src/client/css/']
		},
		client: {
			files: [
				{
					nonull: true,
					dest: 'build/client/css/main.css',
					src: ['src/client/css/*.less']
				},
				{
					nonull: true,
					dest: 'build/client/css/monitor.css',
					src: ['src/client/css/monitor/*.less']
				}
			]
		}
	},
	watch: {
		js_client: {
			files: [
				'src/client/js/**/*.js',
				'src/common/**/*.js',
				'src/client/shaders/*.*'
			],
			tasks: [
				'jshint:client',
				'browserify:client'
			],
			options: {
				spawn: false,
			},
		},
		js_server: {
			files: [
				'src/server/**/*.js',
				'src/common/**/*.js',
				'./index.js',
				'./monitor.js',
				'./config.js'
			],
			tasks: [
				'jshint:server',
				'babel:server',
			],
			options: {
				spawn: false,
			},
		},
		css: {
			files: ['src/client/css/**/*.less'],
			tasks: ['less:client'],
			options: {
				spawn: false,
			},
		},
		html: {
			files: [
				'src/client/*.html',
				'src/assets/*.*'
			],
			tasks: ['copy:html'],
			options: {
				spawn: false,
			},
		},
	},
	clean: ['build'],
});

require('load-grunt-tasks')(grunt);

grunt.registerTask('build', [
	'clean',
	'jshint',
	'babel:server',
	'browserify:client',
	'exorcise',
	'less',
	'copy'
]);

// Default task
grunt.registerTask('default', ['build', 'watch']);

};
