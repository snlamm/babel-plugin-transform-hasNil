/* eslint-disable no-useless-escape */
import flatten from 'flat'
import _get from 'lodash.get'
import template from 'babel-template'
import * as t from 'babel-types'

const hasNilWrapper = template(`
	(
		function(base) {
			let parts = [ base ]

			const proxy = new Proxy(function() {
				let result = parts.shift()

				for(const part of parts) {
					if(result === null || typeof result === \'undefined\') {
						parts = [ ]
						return true
					}

					result = result[part]
				}

				parts = [ ]
				return (result === null) || (typeof result === \'undefined\')
			}, {
				get: function(object, property) {
					parts.push(property)
					return proxy
				}
			})

			return proxy
		}
	)
	`)

function addHasNilHelper() {
	// Modified from https://github.com/MaxMEllon/babel-plugin-transform-isNil/blob/master/src/index.js, itself modified from https://github.com/babel/babel/blob/master/packages/babel-core/src/transformation/file/index.js#L280

	const name = 'hasNilWrapper'

	const declar = this.declarations[name]

	if(declar) {
		return declar
	}

	if(!this.usedHelpers[name]) {
		this.metadata.usedHelpers.push(name)
		this.usedHelpers[name] = true
	}

	const generator = this.get('helperGenerator')
	const runtime = this.get('helpersNamespace')

	if(generator) {
		const res = generator(name)

		if(res) {
			return res
		}
	} else if(runtime) {
		return t.memberExpression(runtime, t.identifier(name))
	}

	const ref = hasNilWrapper().expression
	const uid = this.declarations[name] = this.scope.generateUidIdentifier(name)

	ref._compact = true
	this.scope.push({
		id: uid,
		init: ref,
		unique: true
	})

	return uid
}

export default function() {
	return {
		visitor: {
			MemberExpression(path, state) {
				const { node } = path
				const { property } = node
				let name = ''
				let base = ''

				if(property.name === 'hasNil' && path.parentPath.type !== 'CallExpression') {
					const object = flatten(node)

					Object.keys(object).forEach(key => {
						if(/.type$/.test(key)) {
							if(object[key] === 'ThisExpression') {
								base === '' ? base += 'this' : name += 'this.'
							}
						}

						const isNotNameOrRawValue = !/.name$/.test(key) && !/.extra.raw$/.test(key)

						if(isNotNameOrRawValue || /arguments/.test(key) || object[key] === 'hasNil') {
							return
						}

						// Handle literals such as an array index
						if(/.extra.raw$/.test(key)) {
							const valueType = _get(node, key.replace(/.extra.raw$/, '.type'), null)
							const isComputed = _get(node, key.replace(/.property.extra.raw$/, '.computed'), null)

							if(!/Literal/.test(valueType) || !isComputed) { return }
							if(name.slice(-1) === '.') { name = name.slice(0, -1) }

							name += `[${object[key]}].`
							return
						}

						let keyObject = null
						let keyArguments = null

						if(/\.callee\.name$/.test(key)) {
							// handle function inside of brackets
							keyObject = _get(node, key.replace(/\.property\.callee\.name$/, ''), null)
							keyArguments = _get(node, key.replace(/\.callee\.name$/, '.arguments'), null)
						} else {
							keyObject = _get(node, key.replace(/\.property\.name$/, ''), null)
							keyArguments = _get(node, key.replace(/\.callee\.property\.name$/, '.arguments'), null)
						}

						const getArguments = keyArguments => {
							const args = keyArguments.map(arg => {
								const raw = (arg.extra || { }).raw

								if(arg.type === 'NullLiteral') {
									return 'null'
								}

								return (raw || arg.value || arg.name)
							})

							return args.length === 0 ? '()' : `(...${args})`
						}

						if(base === '') {
							const args = _get(node, key.replace(/\.callee\.name$/, '.arguments'), null)

							base += (Array.isArray(args) ? `${object[key]}${getArguments(args)}` : object[key])
						} else if(keyObject.computed) {
							if(name.slice(-1) === '.') { name = name.slice(0, -1) }

							// eslint-disable-next-line max-len
							name += (Array.isArray(keyArguments) ? `[${object[key]}${getArguments(keyArguments)}].` : `[${object[key]}].`)
						} else if(Array.isArray(keyArguments)) {
							throw new TypeError('hasNil does not support chained function calls using dot notation')
						} else {
							name += `${object[key]}.`
						}
					})

					name = name.replace(/.$/, '')

					const hasNilWrapper = addHasNilHelper.call(state.file).name

					if(name !== '' && (name.slice(0, 1) !== '[')) {
						name = `.${name}`
					}

					/* eslint no-void: 0 */
					path.replaceWithSourceString(`${hasNilWrapper}(${base})${name}()`)
				}
			}
		}
	}
}
