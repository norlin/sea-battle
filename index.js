import Log from 'common/log';
import Server from 'server/server';
import config from './config';

const log = new Log('index');

log.debug('Create server...');
const server = new Server(config);

log.info('Server created!');
