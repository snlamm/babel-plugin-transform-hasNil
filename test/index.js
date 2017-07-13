/* eslint-disable max-len */
import test from 'ava'
import { transform } from 'babel-core'

import plugin from '../lib/index'

const options = {
	presets: [
		'env'
	],
	plugins: [
		plugin
	]
}

const helper = "var _hasNilWrapper = function _hasNilWrapper(base) { var parts = [base]; var proxy = new Proxy(function () { var result = parts.shift(); var _iteratorNormalCompletion = true; var _didIteratorError = false; var _iteratorError = undefined; try { for (var _iterator = parts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) { var part = _step.value; if (result === null || typeof result === 'undefined') { parts = []; return true; } result = result[part]; } } catch (err) { _didIteratorError = true; _iteratorError = err; } finally { try { if (!_iteratorNormalCompletion && _iterator.return) { _iterator.return(); } } finally { if (_didIteratorError) { throw _iteratorError; } } } parts = []; return result === null || typeof result === 'undefined'; }, { get: function get(object, property) { parts.push(property); return proxy; } }); return proxy; };"

const consumableArray = 'function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }'

// A number of tests are modified from https://github.com/MaxMEllon/babel-plugin-transform-isNil/blob/master/test/index.js
const specs = [
	{
		description: 'expect hasNil replace to `=== null || === void 0`',
		before: 'hoge.hasNil',
		after: '_hasNilWrapper(hoge)()'
	},
	{
		description: 'expect ! hasNil replace to `! (=== null || === void 0)`',
		before: '!hoge.hasNil',
		after: '!_hasNilWrapper(hoge)()'
	},
	{
		description: 'expect hasNil() dont replace',
		before: 'R.hasNil()',
		after: 'R.hasNil()',
		noDefaultHelper: true
	},
	{
		description: 'Function call test 1',
		before: 'bar().hasNil',
		after: '_hasNilWrapper(bar())()'
	},
	{
		description: 'Function call test 2',
		before: 'foo[bar()].hasNil',
		after: '_hasNilWrapper(foo)[bar()]()'
	},
	{
		description: 'Function call test 3',
		before: 'foo[bar(hoge)].hasNil',
		after: `${consumableArray}\n\n_hasNilWrapper(foo)[bar.apply(undefined, _toConsumableArray(hoge))]()`
	},
	{
		description: 'Function call test 4',
		before: 'foo[bar(null)][bar(undefined)].hasNil',
		after: `${consumableArray}\n\n_hasNilWrapper(foo)[bar.apply(undefined, _toConsumableArray(null))][bar.apply(undefined, _toConsumableArray(undefined))]()`
	},
	{
		description: 'Function call test 5',
		before: 'bar[hoge()][foo()].hasNil',
		after: '_hasNilWrapper(bar)[hoge()][foo()]()'
	},
	{
		description: 'Array test 1',
		before: 'foo[0].hasNil',
		after: '_hasNilWrapper(foo)[0]()'
	},
	{
		description: 'Array test 2',
		before: 'foo.bar["hoge"].hasNil',
		after: '_hasNilWrapper(foo).bar["hoge"]()'
	},
	{
		description: 'Array test 3',
		before: 'bar[hoge].hasNil',
		after: '_hasNilWrapper(bar)[hoge]()'
	},
	{
		description: 'Complex test 1',
		before: 'foo.bar[hoge("poge")][1].bar.hasNil',
		after: `${consumableArray}\n\n_hasNilWrapper(foo).bar[hoge.apply(undefined, _toConsumableArray("poge"))][1].bar()`
	},
	{
		description: 'Complex test 2',
		before: 'foo.bar["hoge"]["poge"].foo[bar][2].hasNil',
		after: '_hasNilWrapper(foo).bar["hoge"]["poge"].foo[bar][2]()'
	},
	{
		description: 'Complex test 4',
		before: 'bar[hoge][biz()][3].foo.foo2[biz(arg1, arg2, arg2)][foo()].hasNil',
		after: `${consumableArray}\n\n_hasNilWrapper(bar)[hoge][biz()][3].foo.foo2[biz.apply(undefined, _toConsumableArray(arg1).concat([arg2, arg2]))][foo()]()`
	}
]

specs.forEach(spec => {
	test(spec.description, t => {
		const result = transform(spec.before, options)

		if(spec.noDefaultHelper) {
			t.is(result.code, `"use strict";\n\n${spec.after};`)
		} else {
			t.is(result.code, `"use strict";\n\n${helper}\n\n${spec.after};`)
		}
	})
})

test('Chaining a function throws a TypeError', t => {
	const error = t.throws(() => transform('bar.hoge().foo.hasNil', options), TypeError)
	t.is(error.message, 'unknown: hasNil does not support chained function calls using dot notation')
})
