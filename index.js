'use strict';

/* globals WeakMap */

var isCallable = require('is-callable');
var isString = require('is-string');
var has = require('has');
var forEach = require('for-each');
var isArray = require('isarray');
var functionName = require('function.prototype.name');
var inspect = require('object-inspect');
var semver = require('semver');
var jestVersion = require('jest').getVersion();

var checkWithName = require('./helpers/checkWithName');

var withOverrides = require('./withOverrides');
var withOverride = require('./withOverride');
var withGlobal = require('./withGlobal');

var hasPrivacy = typeof WeakMap === 'function';
var wrapperMap = hasPrivacy ? new WeakMap() : /* istanbul ignore next */ null;
var modeMap = hasPrivacy ? new WeakMap() : /* istanbul ignore next */ null;

var MODE_ALL = 'all';
var MODE_SKIP = 'skip';
var MODE_ONLY = 'only';

var beforeMethods = ['beforeAll', 'beforeEach'];
var afterMethods = ['afterAll', 'afterEach'];
var supportedMethods = [].concat(beforeMethods, afterMethods);

/**
 * There is a bug in Jest 18/19 that processes the afterAll hooks in the wrong
 * order. This bit of logic is meant to understand which method Jest is using
 * for moving through the list of afterAll hooks, and supply them in the order
 * that gets them applied in the order we want.
 */
var needsAfterAllReversal = semver.satisfies(jestVersion, '< 20');

var JestWrapper;

var checkThis = function requireJestWrapper(instance) {
	if (!instance || typeof instance !== 'object' || !(instance instanceof JestWrapper)) {
		throw new TypeError(inspect(instance) + ' must be a JestWrapper');
	}
	return instance;
};

var setThisWrappers = function (instance, value) {
	checkThis(instance);
	/* istanbul ignore else */
	if (hasPrivacy) {
		wrapperMap.set(instance, value);
	} else {
		instance.wrappers = value; // eslint-disable-line no-param-reassign
	}
	return instance;
};

var getThisWrappers = function (instance) {
	checkThis(instance);
	return hasPrivacy ? wrapperMap.get(instance) : /* istanbul ignore next */ instance.wrappers;
};

var setThisMode = function (instance, mode) {
	checkThis(instance);
	/* istanbul ignore else */
	if (hasPrivacy) {
		modeMap.set(instance, mode);
	} else {
		instance.mode = mode; // eslint-disable-line no-param-reassign
	}
	return instance;
};

var getThisMode = function (instance) {
	checkThis(instance);
	return hasPrivacy ? modeMap.get(instance) : /* istanbul ignore next */ instance.mode;
};

JestWrapper = function JestWrapper() { // eslint-disable-line no-shadow
	setThisWrappers(this, []);
	setThisMode(this, MODE_ALL);
};

var createWithWrappers = function (wrappers) {
	return setThisWrappers(new JestWrapper(), wrappers);
};

var concatThis = function (instance, toConcat) {
	var thisWrappers = getThisWrappers(instance);
	var thisMode = getThisMode(instance);
	return setThisMode(createWithWrappers(thisWrappers.concat(toConcat || [])), thisMode);
};

var flattenToDescriptors = function flattenToDescriptors(wrappers) {
	if (wrappers.length === 0) { return []; }

	var descriptors = [];
	forEach(wrappers, function (wrapper) {
		var subWrappers = wrapper instanceof JestWrapper ? getThisWrappers(wrapper) : wrapper;
		if (Array.isArray(subWrappers)) {
			descriptors.push.apply(descriptors, flattenToDescriptors(subWrappers));
		} else {
			descriptors.push(subWrappers);
		}
	});
	return descriptors;
};

var applyMethods = function applyMethods(methodsToApply, descriptors) {
	forEach(descriptors, function (methods) {
		forEach(methodsToApply, function (method) {
			var functions = methods[method];
			if (functions) {
				forEach(functions, function (func) {
					global[method](func);
				});
			}
		});
	});
};

var createAssertion = function createAssertion(type, message, wrappers, block, mode) {
	var descriptors = flattenToDescriptors(wrappers);
	if (descriptors.length === 0 && mode === MODE_ALL) {
		throw new RangeError(inspect(type) + ' called with no wrappers defined');
	}

	var describeMsgs = [];
	forEach(descriptors, function (descriptor) {
		if (descriptor.description) {
			describeMsgs.push(descriptor.description);
		}
	});

	var describeMsg = 'wrapped: ' + describeMsgs.join('; ') + ':';
	var describeMethod = global.describe;
	if (mode === MODE_SKIP) {
		describeMethod = global.describe.skip;
	} else if (mode === MODE_ONLY) {
		describeMethod = global.describe.only;
	}

	describeMethod(describeMsg, function () {
		applyMethods(beforeMethods, descriptors);
		global[type](message, block);

		// See comment at top of file.
		if (needsAfterAllReversal) {
			applyMethods(['afterEach'], descriptors);
			applyMethods(['afterAll'], descriptors.reverse());
		} else {
			applyMethods(afterMethods, descriptors);
		}
	});
};

JestWrapper.prototype.skip = function skip() {
	return setThisMode(concatThis(this), MODE_SKIP);
};

JestWrapper.prototype.only = function only() {
	return setThisMode(concatThis(this), MODE_ONLY);
};

JestWrapper.prototype.it = function it(msg, fn) {
	var wrappers = getThisWrappers(checkThis(this));
	var mode = getThisMode(this);
	createAssertion('it', msg, wrappers, fn, mode);
};
JestWrapper.prototype.it.skip = function skip() {
	throw new SyntaxError('jest-wrap requires `.skip().it` rather than `it.skip`');
};
JestWrapper.prototype.it.only = function only() {
	throw new SyntaxError('jest-wrap requires `.only().it` rather than `it.only`');
};

JestWrapper.prototype.test = function test(msg, fn) {
	var wrappers = getThisWrappers(checkThis(this));
	var mode = getThisMode(this);
	createAssertion('test', msg, wrappers, fn, mode);
};
JestWrapper.prototype.test.skip = function skip() {
	throw new SyntaxError('jest-wrap requires `.skip().test` rather than `test.skip`');
};
JestWrapper.prototype.test.only = function only() {
	throw new SyntaxError('jest-wrap requires `.only().test` rather than `test.only`');
};

JestWrapper.prototype.describe = function describe(msg, fn) {
	var wrappers = getThisWrappers(checkThis(this));
	var mode = getThisMode(this);
	createAssertion('describe', msg, wrappers, fn, mode);
};
JestWrapper.prototype.describe.skip = function skip() {
	throw new SyntaxError('jest-wrap requires `.skip().describe` rather than `describe.skip`');
};
JestWrapper.prototype.describe.only = function only() {
	throw new SyntaxError('jest-wrap requires `.only().describe` rather than `describe.only`');
};

var wrap = function wrap() { return new JestWrapper(); };

var isWithNameAvailable = function (name) {
	checkWithName(name);
	return !has(JestWrapper.prototype, name) || !isCallable(JestWrapper.prototype[name]);
};

wrap.supportedMethods = isCallable(Object.freeze)
	? Object.freeze(supportedMethods)
	: /* istanbul ignore next */ supportedMethods.slice();

JestWrapper.prototype.extend = function extend(description, descriptor) {
	checkThis(this);
	if (!isString(description) || description.length === 0) {
		throw new TypeError('a non-empty description string is required');
	}
	var newWrappers = [];
	if (descriptor) {
		forEach(supportedMethods, function (methodName) {
			if (methodName in descriptor) {
				if (!isArray(descriptor[methodName])) {
					// eslint-disable-next-line no-param-reassign
					descriptor[methodName] = [descriptor[methodName]];
				}
				forEach(descriptor[methodName], function (method) {
					if (!isCallable(method)) {
						throw new TypeError('wrapper method "' + method + '" must be a function, or array of functions, if present');
					}
				});
			}
		});
		descriptor.description = description; // eslint-disable-line no-param-reassign
		newWrappers = [createWithWrappers([descriptor])];
	}
	return concatThis(this, newWrappers);
};

JestWrapper.prototype.use = function use(plugin) {
	checkThis(this);
	if (!isCallable(plugin)) {
		throw new TypeError('plugin must be a function');
	}
	var withName = functionName(plugin);
	checkWithName(withName);

	var extraArguments = Array.prototype.slice.call(arguments, 1);
	var descriptorOrInstance = plugin.apply(this, extraArguments) || {};

	var instance = descriptorOrInstance;
	if (!(descriptorOrInstance instanceof JestWrapper)) {
		instance = wrap().extend(descriptorOrInstance.description, descriptorOrInstance);
	}

	var thisMode = getThisMode(instance);
	return setThisMode(setThisWrappers(new JestWrapper(), [instance]), thisMode);
};

wrap.register = function register(plugin) {
	var withName = functionName(plugin);
	checkWithName(withName);
	if (!isWithNameAvailable(withName)) {
		// already registered
		return;
	}
	JestWrapper.prototype[withName] = function wrapper() {
		return this.use.apply(this, [plugin].concat(Array.prototype.slice.call(arguments)));
	};
};

wrap.unregister = function unregister(pluginOrWithName) {
	var withName = isCallable(pluginOrWithName) ? functionName(pluginOrWithName) : pluginOrWithName;
	checkWithName(withName);
	if (isWithNameAvailable(withName)) {
		throw new RangeError('error: plugin "' + withName + '" is not registered.');
	}
	delete JestWrapper.prototype[withName];
};

wrap.register(withOverrides);
wrap.register(withOverride);
wrap.register(withGlobal);

module.exports = wrap;
