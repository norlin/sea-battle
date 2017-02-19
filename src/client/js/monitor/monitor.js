import MG from 'metrics-graphics';

function formatDuration(ms) {
	ms = Math.round(ms);

	if (ms < 1000) {
		return ms+'ms';
	}

	let seconds = Math.floor(ms / 1000);
	ms = ms - seconds*1000;

	if (seconds < 60) {
		return `${seconds}s`+ (ms ? ` ${ms}ms` : '');
	}

	let minutes = Math.floor(seconds / 60);
	seconds = seconds - minutes*60;

	//if (minutes < 60) {
	return `${minutes}m`+(seconds ? ` ${seconds}s` : '')+(ms ? ` ${ms}ms` : '');
	//}
}

function rolloverFormat(data) {
	return formatDuration(data.ms)+' ';
}

function rolloverFormatY(data) {
	return data.value+'ms';
}

let options = {
	title: 'Tick, Interval',
	data: [], // an array of objects, such as [{value:100,date:...},...]
	baselines: [
		{value: (1/60)*1000, label: '1/60th of second'}
	],
	colors: ['red', 'blue'],
	legend: ['tick', 'interval'],
	legend_target: '.monitor-chart-legend',
	full_width: true,
	full_height: true,
	animate_on_load: false,
	transition_on_update: false,
	show_tooltips: false,
	missing_is_hidden: true,
	missing_text: 'No data available!',
	target: '#target', // the html element that the graphic is inserted in
	x_accessor: 'ms',  // the key that accesses the x value
	y_accessor: 'value', // the key that accesses the y value
	min_y: 0,
	max_y: null,
	xax_format: formatDuration,
	//show_rollover_text: false,
	x_mouseover: rolloverFormat,
	y_mouseover: rolloverFormatY
};

function update() {
	let tick_data, interval_data;

	function check() {
		if (!tick_data || !interval_data) {
			return;
		}

		options.data = [tick_data, interval_data];
		MG.data_graphic(options);

		window.setTimeout(update, 1000);
	}

	fetch('/data?name=interval').then((res)=>{
		res.json().then((json)=>{
			interval_data = json;
			check();
		});
	});

	fetch('/data?name=tick').then((res)=>{
		res.json().then((json)=>{
			tick_data = json;
			check();
		});
	});
}

window.addEventListener('load', function(){
	update();
});
