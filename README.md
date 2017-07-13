# babel-plugin-transform-hasNil

With this babel plugin, use `.hasNil` to traverse chained object properties and determine whether any of them return `null` or `undefined`.

This plugin is inspired by [babel-plugin-transform-isNil](https://github.com/MaxMEllon/babel-plugin-transform-isNil), however the use case and internals are different.

## Examples

```js
const house = { kitchen: { drawer: [ ] } }
const d = 'drawer'
const goTo = function(location) {
	return location
}

if(house.kitchen.hasNil) {	/* false */
	console.log('this will not run')
}

if(house["kitchen"].hasNil) {	/* false */
	console.log('this will not run')
}

if(house.kitchen[d].hasNil) {	/* false */
	console.log('this will not run')
}

if(house[goTo(kitchen)].drawer.hasNil) {	/* false */
	console.log('this will not run')
}

if(house.kitchen.drawer[3].hasNil) {	/* true */
	console.log('this will run')
}

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
