# babel-plugin-transform-hasNil

<a href="https://travis-ci.org/snlamm/babel-plugin-transform-hasNil"><img src="https://travis-ci.org/snlamm/babel-plugin-transform-hasNil.svg?branch=master" alt="Build Status"></a>
<a href='https://coveralls.io/github/snlamm/babel-plugin-transform-hasNil?branch=master'><img src='https://coveralls.io/repos/github/snlamm/babel-plugin-transform-hasNil/badge.svg?branch=master' alt='Coverage Status' /></a>
<a href="https://www.npmjs.com/package/babel-plugin-transform-hasnil"><img src="https://img.shields.io/npm/v/babel-plugin-transform-hasnil.svg" alt="NPM Version"></a>
<a href="https://www.npmjs.com/package/babel-plugin-transform-hasnil"><img src="https://img.shields.io/npm/l/babel-plugin-transform-hasnil.svg" alt="License"></a>

With this babel plugin, use `.hasNil` to traverse chained object properties and determine whether any of them return `null` or `undefined`.

This plugin is inspired by [babel-plugin-transform-isNil](https://github.com/MaxMEllon/babel-plugin-transform-isNil), however the use case and internals are different.

## Examples

```js
const house = { kitchen: { drawer: [ ] } }
const drawer = 'drawer'
const goTo = function(location) {
	return location
}

if(house.kitchen.hasNil) {	/* false */
	console.log('this will not run')
}

// with a string literal
if(house['kitchen'].hasNil) {	/* false */
	console.log('this will not run')
}

// with a variable
if(house.kitchen[drawer].hasNil) {	/* false */
	console.log('this will not run')
}

// with a function using bracket notation
if(house[goTo('kitchen')].drawer.hasNil) {	/* false */
	console.log('this will not run')
}

// with a number literal
if(house.kitchen.drawer[3].hasNil) {	/* true */
	console.log('this will run')
}

// you can chain as many properties as you want
if(house[goTo(kitchen)].drawer[3]['sub-drawer'].forks.hasNil) {	/* true */
	console.log('this will run')
}

if(house.basement.closet[3].hasNil) {	/* true */
	console.log('this will run')
}

// Unsupported:

// chaining functions using dot notation
if(house.foo().hasNil) {	/* will not work */
	console.log('this will not work')
}

// logical operators
if((house || { }).hasNil) {	/* will not work */
	console.log('this will not work')
}
```

## Installation
Due to [Babel not handling](http://babeljs.io/learn-es2015/#ecmascript-2015-features-proxies) the Proxy object, this plugin is only compatible with Node versions >= 6.0.0.

First, add the `babel-plugin-transform-hasnil` package via your preferred package manager:

```shell
npm install --save-dev babel-plugin-transform-hasnil
```

Then register with babel, such as by using the `.babelrc` file.

```json
{
	"plugins": [ "babel-plugin-transform-hasnil" ]
}
```

## Benchmarking
Summary: using `hasNil` is not as fast as using pure logical operators or `isNil` (which compiles to the same thing). In general, however, this should only impact you if you're looping > 10,000 times.

Here's a benchmark:
```js
const entry = { first: { second: [ { third: { fourth: { } } } ] } }
```

The goal is to determine whether `first.second[0].third.fourth` returns `null` or `undefined`.

Operator logic:
```js
(entry === null) || (entry === undefined) || (entry.first === null) || (entry.first === undefined) || (entry.first.second === null) || (entry.first.second === undefined) || (entry.first.second[0] === null) || (entry.first.second[0] === undefined) || (entry.first.second[0].third === null) || (entry.first.second[0].third === undefined) || (entry.first.second[0].third.fourth === null) || (entry.first.second[0].third.fourth === undefined)
```

isNil logic (does not support number literals such as `[0]`):
```js
entry.isNil || entry.first.isNil || entry.first.second.isNil || (entry.first.second[0] === null) || (entry.first.second[0] === undefined) || (entry.first.second[0].third === null) || (entry.first.second[0].third === undefined) || (entry.first.second[0].third.fourth === null) || (entry.first.second[0].third.fourth === undefined)
```

hasNil logic:
```js
entry.first.second[0].third.fourth.hasNil
```

Results:

| cycles  | operator | isNil | hasNil |
|---------|----------|-------|--------|
| 100     | 0 ms     | 0 ms  | 0 ms   |
| 1,000   | 0        | 0     | 2      |
| 10,000  | 1        | 1     | 24     |

## Contributing
Contributions are always welcome. You are encouraged to open issues and merge requests.

To run the tests, use `npm run test`.
