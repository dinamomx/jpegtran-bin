const {join} = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const binBuild = require('bin-build');

const sourceUrl = 'https://downloads.sourceforge.net/project/libjpeg-turbo/2.0.0/libjpeg-turbo-2.0.0.tar.gz';

const buildConfig = binPath => [
	'(cd build &&',
	'cmake -G"Unix Makefiles"',
	'-ENABLE_SHARED=0',
	`-DCMAKE_INSTALL_PREFIX="${binPath}"`,
	`-DCMAKE_INSTALL_BINDIR="${binPath}"`,
	'..)'
].join(' ');

function buildBinary(binPath) {
	// TODO: Make windows and mac commands
	return binBuild.url(sourceUrl, [
		'mkdir build',
		buildConfig(binPath),
		'(cd build && make && make install)'
	]);
}

async function makeExecutable(binPath) {
	try {
		await exec(`chmod +x ${join(binPath, 'jpegtran')}`);
	} catch (error) {
		console.error({error, binPath});
	}
}

module.exports = {
	sourceUrl,
	buildConfig,
	buildBinary,
	makeExecutable
};
