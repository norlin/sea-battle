import Log from 'common/log';
import Monitor from 'server/monitor';
import config from 'config';

const log = new Log('monitor');

log.debug('Create monitor...');
const monitor = new Monitor(config.monitor);

log.info('Monitor created!');
