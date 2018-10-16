'use strict';
const fs = require('fs');
const path = require('path');
const test = require('ava');
const execa = require('execa');
const tempy = require('tempy');
const binCheck = require('bin-check');
const compareSize = require('compare-size');
const jpegtran = require('..');
const {buildBinary} = require('../lib/utils');

test('rebuild the jpegtran binaries', async t => {
	const tmp = tempy.directory();
	try {
		await buildBinary(tmp);
	} catch (error) {
		t.ifError(error);
	}
	t.true(fs.existsSync(path.join(tmp, 'jpegtran')));
});

test('return path to binary and verify that it is working', async t => {
	t.true(await binCheck(jpegtran, ['-version']));
});

test('minify a JPG', async t => {
	const tmp = tempy.directory();
	const src = path.join(__dirname, 'fixtures/test.jpg');
	const dest = path.join(tmp, 'test.jpg');
	const args = [
		'-outfile',
		dest,
		src
	];

	await execa(jpegtran, args);
	const res = await compareSize(src, dest);

	t.true(res[dest] < res[src]);
});
