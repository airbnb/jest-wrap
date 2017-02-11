'use strict';

var assert = require('assert');
var wrap = require('../../');

describe('core JestWrapper semantics', function () {
	it('throws when there are no transformations', function () {
		assert['throws'](function () { wrap().describe('foo', function () {}); }, RangeError);
		assert['throws'](function () { wrap().it('foo', function () {}); }, RangeError);
		assert['throws'](function () { wrap().test('foo', function () {}); }, RangeError);
	});

	var withNothing = function withNothing() {
		return { description: 'i am pointless' };
	};

	describe('#use()', function () {
		var flag = false;
		var withDescriptor = function withDescriptor() {
			return {
				description: 'i am a descriptor',
				beforeEach: function () { flag = true; },
				afterEach: function () { flag = false; }
			};
		};

		wrap().use(withDescriptor).describe('with a plugin that returns a descriptor', function () {
			it('works', function () {
				assert.equal(flag, true);
			});
		});

		wrap().use(withNothing).it('works with a plugin that returns a descriptor with only a description', function () {
			assert.equal(true, true); // oh yeah, TESTING
		});
	});

	describe('#skip()', function () {
		wrap().use(withNothing).skip().it('skipped an it!', function () {
			assert.equal(true, false); // boom
		});

		wrap().use(withNothing).skip().describe('skipped a describe!', function () {
			it('fails if not skipped', function () {
				assert.equal(true, false); // boom
			});
		});

		wrap().use(withNothing).skip().test('skipped a test!', function () {
			it('fails if not skipped', function () {
				assert.equal(true, false); // boom
			});
		});
	});

	var calls = [];
	describe('ordering of before/afters with multiple plugins', function () {
		wrap().extend('first', {
			beforeAll: function () { calls.push('>:beforeAll'); },
			beforeEach: function () { calls.push('>:beforeEach'); },
			afterAll: function () { calls.push('>:afterAll'); },
			afterEach: function () { calls.push('>:afterEach'); }
		}).extend('second', {
			beforeAll: function () { calls.push('>>:beforeAll'); },
			beforeEach: function () { calls.push('>>:beforeEach'); },
			afterAll: function () { calls.push('>>:afterAll'); },
			afterEach: function () { calls.push('>>:afterEach'); }
		}).describe('with method tracking', function () {
			it('is one test', function () { calls.push('>>>:test'); });
			it('is another test', function () { calls.push('>>>:test'); });
		});
	});

	afterAll(function () {
		assert.deepEqual(calls, [
			'>:beforeAll',
			'>>:beforeAll',

			'>:beforeEach',
			'>>:beforeEach',
			'>>>:test',
			'>>:afterEach',
			'>:afterEach',

			'>:beforeEach',
			'>>:beforeEach',
			'>>>:test',
			'>>:afterEach',
			'>:afterEach',

			'>>:afterAll',
			'>:afterAll'
		]);
	});
});
