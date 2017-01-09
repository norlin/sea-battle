import Game from './game';
import Constructor from './constructor';

window.addEventListener('load', function(){
	if (document.getElementById('constructor')) {
		new Constructor({canvas: 'constructor'});
	} else {
		new Game({canvas: 'canvas'});
	}
});
