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
				let result = parts.splice(0, 1)

				for(const part of parts) {
					if(result === null || typeof result === \'undefined\') {
						parts = [ ]
						return true
					}

					result = result[part]
				}

				parts = [ ]
				return false
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
	// Modified from https://github.com/babel/babel/blob/master/packages/babel-core/src/transformation/file/index.js#L280

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

						if(!/.name$/.test(key) || /arguments/.test(key) || object[key] === 'hasNil') {
							return
						}

						const keyObject = _get(node, key.replace(/\.property\.name$/, ''), null)
						const keyArguments = _get(node, key.replace(/\.callee.property\.name$/, '.arguments'), null)

						if(base === '') {
							base += object[key]
						} else if(keyObject.computed) {
							if(name.slice(-1) === '.') { name = name.slice(0, -1) }

							name += `[${object[key]}].`
						} else if(Array.isArray(keyArguments)) {
							if(name.slice(-1) === '.') { name = name.slice(0, -1) }

							const args = keyArguments.map(arg => arg.value)
							const argExpression = args.length === 0 ? '()' : `(...${args})`

							name += `[${object[key]}${argExpression}].`
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
