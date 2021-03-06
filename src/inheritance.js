import _ from 'lodash'

// Used with mergeWith to concat arrays of same prop
// See https://lodash.com/docs/4.17.4#mergeWith
function customizer (obj, src) {
  if (_.isArray(obj)) {
    // only use the first appearance of a role
    return _.uniqBy(_.concat(obj, src), (item) => {
      return item.name || item
    })
  }
}

// keyword is used as the prop to find the next targets in hydration
export const inheritance = ({ keyword = 'inherits' } = {}) => {
  function hydrator (rbacl = {}, target = '', result = {
    incl: [],
    [keyword]: []
  }, cycles = 0, initTarget = target) {
    const replace = (target) => hydrator(rbacl, target)

    if (target) {
      let res = _.mergeWith({}, result, { incl: [target] }, rbacl[target], customizer)

      // do not rehydrate roles if they are already in our result object
      const filterFinished = role => !_.includes(res.incl, role)
      const nextTarget = _.filter(res[keyword], filterFinished)[0]

      res = _.assign({}, res, {
        [keyword]: _.without(res[keyword], nextTarget)
      })

      // recursive
      return hydrator(rbacl, nextTarget, res, cycles + 1, initTarget)
    } else {
      result = _.pick(result, ['incl', 'can'])

      if (!_.has(result, 'can')) {
        result.can = []
      }

      return _.assign(replace, {
        valueOf () {
          return result
        },

        toString () {
          return `rbacl[${initTarget}] => ${JSON.stringify(result)}`
        },

        get res () {
          return result
        },

        get target () {
          return initTarget
        },

        get cycles () {
          return cycles
        },

        get keyword () {
          return keyword
        },

        replace,
        constructor: hydrator
      })
    }
  }

  hydrator.of = hydrator

  return hydrator
}

export const hydrator = inheritance()
export default hydrator
