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
if(house["kitchen"].hasNil) {	/* false */
	console.log('this will not run')
}

// with a variable
if(house.kitchen[drawer].hasNil) {	/* false */
	console.log('this will not run')
}

// with a function using bracket notation
if(house[goTo(kitchen)].drawer.hasNil) {	/* false */
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
First, add the `babel-plugin-transform-hasnil` package via your preferred package manager:

```shell
npm install --save-dev plugin-grind-mixins
```

Then register with babel, such as by using the `.babelrc` file.

```json
{
	"plugins": [ "babel-plugin-transform-hasnil" ]
}
```

## Contributing
Contributions are always welcome. You are encouraged to open issues and merge requests.

To run the tests, use `npm run test`.
