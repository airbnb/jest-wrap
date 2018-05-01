'use strict';

var assert = require('assert');
var wrap = require('../../');

describe('core JestWrapper semantics', function () {
	describe('when there are no transformations', function () {
		it('throws when there are no transformations', function () {
			assert['throws'](function () { wrap().describe('foo', function () {}); }, RangeError);
			assert['throws'](function () { wrap().it('foo', function () {}); }, RangeError);
			assert['throws'](function () { wrap().test('foo', function () {}); }, RangeError);
		});

		it('does not throw when the mode is "skip"', function () {
			assert.doesNotThrow(function () { wrap().skip().describe('foo', function () {}); });
			assert.doesNotThrow(function () { wrap().skip().it('foo', function () {}); });
			assert.doesNotThrow(function () { wrap().skip().test('foo', function () {}); });
		});
	});

	var withNothing = function withNothing() {
		return { description: 'i am pointless' };
	};

	var testingCount = 0;
	var withTesting = function withTesting() {
		return this.extend('(with Testing)', {
			beforeEach: function withTestingBeforeEach() {
				testingCount += 1;
			}
		});
	};

	var withFancyNoop = function withFancyNoop() {
		return this.extend('(withFancyNoop)', {});
	};

	var withSkip = function withSkip() {
		return this.skip().extend('i am skipped', {});
	};

	wrap()
	.use(withSkip)
	.it('skips a test when the plugin skips it', function () {
		throw new SyntaxError('this should never run');
	});

	wrap()
	.use(withTesting)
	.use(withFancyNoop)
	.describe('with multiple plugins', function () {
		it('calls the plugin\'s hooks an appropriate number of times', function () {
			assert.equal(testingCount, 1);
		});
	});

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

	/**
	 * Temporarily replace describe so that we can assert on the passed params.
	 */
	var originalDescribe = global.describe;
	var passedDescription;
	global.describe = function (description) {
		passedDescription = description;
		global.describe = originalDescribe; // revert to mocha's describe.
		return originalDescribe.apply(this, arguments);
	};

	wrap()
	.use(withFancyNoop)
	.use(withTesting)
	.describe('wrapped descriptions', function () {
		it('should have the proper description', function () {
			assert.equal(passedDescription, 'wrapped: (withFancyNoop); (with Testing):');
		});
	});

	var calls = [];
	describe('ordering of before/afters with multiple plugins', function () {
		var testsRun = 0;
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
			it('is one test', function () {
				testsRun += 1;
				calls.push('>>>:test');
			});

			it('is another test', function () {
				testsRun += 1;
				calls.push('>>>:test');
			});
		});

		it('runs the hooks/tests in the correct order', function () {
			if (testsRun !== 2) { throw new Error('This test cannot be run in isolation.'); }
			var expectedCalls = [
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
			];

			expect(calls).toEqual(expectedCalls);
		});
	});
});
