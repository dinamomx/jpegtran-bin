const {join} = require('path');
const util = require('util');
const fs = require('fs');
const os = require('os');
const exec = util.promisify(require('child_process').exec);

const access = util.promisify(fs.access);
const binBuild = require('bin-build');

const osVersion = os.release();
const sourceUrl = 'https://downloads.sourceforge.net/project/libjpeg-turbo/2.0.0/libjpeg-turbo-2.0.0.tar.gz';

const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';
const isSunos = process.platform === 'sunos';
const isFreeBSD = process.platform === 'freebsd';
const isMojave = isMac && osVersion.startsWith('18');
const isUnix = (isMac || isSunos || isFreeBSD || isLinux);
let yasmPath = '';

const binaryName = isUnix ? 'jpegtran' : 'jpegtran.exe';

/**
 * Generate a shell command to build jpegtran
 * @param {String} binPath - The path where binary will be located
 * @returns {String} The string representaton of a shell command
 */
const buildConfig = binPath => [
	'(cd build &&',
	(isMac ? `ASM_NASM="${yasmPath}"${(isMojave ? '' : ' CFLAGS="-mmacosx-version-min=10.5"')}` : ''),
	(isUnix ? 'cmake -G"Unix Makefiles"' : 'cmake -G"NMake Makefiles" -DCMAKE_BUILD_TYPE=Release'),
	'-DENABLE_SHARED=0',
	'-DCMAKE_POSITION_INDEPENDENT_CODE=1',
	'-DREQUIRE_SIMD=1',
	`-DCMAKE_INSTALL_PREFIX="${binPath}"`,
	`-DCMAKE_INSTALL_BINDIR="${binPath}"`,
	'..)'
].join(' ');

/**
 * @description Checks if the path is a file, and is executable
 *
 * @param {String} path - The path of the binary to check
 * @returns {Boolean} Is executable
 */
async function checkIfExecutable(path) {
	try {
		await access(path, fs.constants.F_OK | fs.constants.R_OK | fs.constants.X_OK);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * @description Script to build the binary according to the platform
 *
 * @param {String} binPath - Where the binary will be located
 * @returns  {Promise} The binBuild instance
 */
async function buildBinary(binPath) {
	// TODO: Make windows and sunos commands
	if (isSunos) {
		console.warn('Still no build script for this platform.');
		// eslint-disable-next-line unicorn/no-process-exit
	}
	if (isFreeBSD) {
		console.warn('Build on this platform is not tested.');
	}
	if (isMac) {
		// Testing necesary deps
		const nasm = await checkIfExecutable('/opt/local/bin/nasm');
		const nasmBrew = await checkIfExecutable('/usr/local/bin/nasm');
		const yasm = await checkIfExecutable('/opt/local/bin/yasm');
		const yasmBrew = await checkIfExecutable('/usr/local/bin/yasm');
		if (nasm) {
			yasmPath = '/opt/local/bin/nasm';
		} else if (nasmBrew) {
			yasmPath = '/usr/local/bin/nasm';
		} else if (yasm) {
			yasmPath = '/opt/local/bin/yasm';
		} else if (yasmBrew) {
			yasmPath = '/usr/local/bin/yasm';
		} else {
			throw new Error('Yasm/Nasm is not installed');
		}
	}
	return binBuild.url(sourceUrl, [
		'mkdir build',
		buildConfig(binPath),
		(isUnix ?
			'(cd build && make && make install)' :
			'(cd build && nmake && nmake install)'
		)
	]);
}

/**
 * @description Makes the jpegtran executable
 *
 * @param {String} binPath - The base path where jpegtran will be found
 */
async function makeExecutable(binPath) {
	if (isWin) {
		return;
	}
	try {
		await exec(`chmod +x ${join(binPath, binaryName)}`);
	} catch (error) {
		console.error({error, binPath});
	}
}

module.exports = {
	sourceUrl,
	buildConfig,
	buildBinary,
	makeExecutable,
	binaryName
};
