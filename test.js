const { fromJS, Map } = require('immutable')
const createStore = require('.')

module.exports = [
    {
        description: 'nothing on it',
        test: () => {
            const { getState, send } = createStore()
            
            send({
                convertedToImmutable: true
            })
            
            return getState()
        },
        shouldEqual: fromJS({
            convertedToImmutable: true
        })
    },
    {
        description: 'alert a simple subscription',
        test: (check) => {
            const { subscribe, send } = createStore()

            subscribe([], check),

            send({
                sendsTheEntireState: true
            })
        },
        shouldEqual: fromJS({
            sendsTheEntireState: true
        })
    },
    {
        description: 'alert a more pointed subscription',
        test: (check) => {
            const { subscribe, send } = createStore()

            send({
                a: [1, 2]
            })

            subscribe(['a', 0], check)

            send({
                a: [3, 2]
            })
        },
        shouldEqual: 3
    },
    {
        description: 'don’t alert non affected subscription',
        test: (check) => {
            const { subscribe, send } = createStore()

            send({
                a: [1, 2]
            })

            let shouldNotUpdateThis = 1
            subscribe(['a', 1], (newValue) => {shouldNotUpdateThis = newValue})

            send({
                a: [3, 2]
            })

            setTimeout(() => check(shouldNotUpdateThis))
        },
        shouldEqual: 1
    },
    {
        description: 'subscription on a immutable structure',
        test: (check) => {
            const { subscribe, send } = createStore()

            send({
                a: [{
                    more: 'complex'
                }, 2]
            })

            subscribe(['a', 0], check)

            send({
                a: [{
                    more: 'different'
                }, 2]
            })
        },
        shouldEqual: fromJS({
            more: 'different'
        })
    },
    {
        description: 'subscription gets whole state as second argument',
        test: (check) => {
            const { subscribe, send } = createStore()

            send({
                a: [1, 2]
            })

            subscribe(['a', 0], (_, newState) => check(newState))

            send({
                a: [3, 2]
            })
        },
        shouldEqual: fromJS({
            a: [3, 2]
        })
    },
    {
        description: 'same path and function makes subscription unique',
        test: (check) => {
            const { subscribe, send } = createStore()

            send({
                a: [1, 2]
            })

            let callCount = 0
            const uniqueCallback = () => {callCount += 1}
            subscribe(['a', 0], uniqueCallback)
            subscribe(['a', 0], uniqueCallback)
            subscribe(['a', 0], uniqueCallback)

            send({
                a: [3, 2]
            })
            setTimeout(() => check(callCount))
        },
        shouldEqual: 1
    },
    {
        description: 'it is possible to unsubscribe',
        test: (check) => {
            const { subscribe, unsubscribe, send } = createStore()

            send({
                a: [1, 2]
            })

            let callCount = 0
            const uniqueCallback = () => {callCount += 1}
            subscribe(['a', 0], uniqueCallback)
            unsubscribe(['a', 0], uniqueCallback)

            send({
                a: [3, 2]
            })
            setTimeout(() => check(callCount))
        },
        shouldEqual: 0
    },
    {
        description: 'can set an update function and dispatch with a Redux compatible API',
        test: () => {
            const reducer = (state = Map(), action) => {
                switch (action.type) {
                    case 'START':
                        return state.set('started', true)
                    default:
                        return state
                }
            }
            const { dispatch, getState } = createStore(reducer)

            dispatch({ type: 'START' })

            return getState().toJS()
        },
        shouldEqual: { started: true }
    },
    {
        description: 'also can set an initial state',
        test: () => createStore(undefined, { initial: true }).getState().toJS(),
        shouldEqual: { initial: true }
    },
    {
        description: 'can set default subscriptions which are triggered immediately',
        test: (check) => {
            createStore(
                undefined,
                {
                    a: [1, 2]
                },
                [
                    ['a', 0], check
                ]
            )
        },
        shouldEqual: 1
    }
]