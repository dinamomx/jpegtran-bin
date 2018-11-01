'use strict';
const log = require('logalot');
const {buildBinary, makeExecutable} = require('./utils');
const bin = require('.');

const binPath = bin.dest();

(async () => {
	try {
		await bin.download();
		await makeExecutable(binPath);
		await bin.run(['-version']);
		log.success('jpegtran pre-build test passed successfully');
	} catch (error) {
		log.warn(error.message);
		log.warn('jpegtran pre-build test failed');
		log.info('compiling from source');
		try {
			await buildBinary(binPath);
			log.success('jpegtran built successfully');
		} catch (error) {
			log.error(error.stack);
			throw error;
		}
	}
})();
