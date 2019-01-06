const { fromJS, isImmutable, List, Map } = require('immutable')

const createStore = (update = x => x, initialState = undefined, ...subscriptions) => {
    const store = {
        state: undefined,
        subscriptions: fromJS(subscriptions)
    }

    const send = (newState) => {
        const immutableNewState = fromJS(newState)
        store.subscriptions.forEach(
            (subscription) => {
                const pattern = subscription.get(0)
                const effect = subscription.get(1)
                const newValue = immutableNewState.getIn(pattern)
                
                if (store.state === undefined) {
                    return effect(newValue, immutableNewState)
                }

                const currentValue = store.state.getIn(pattern)
                if (isImmutable(currentValue) && isImmutable(newValue)) {
                    if (!currentValue.equals(newValue)) {
                        effect(newValue, immutableNewState)
                    }
                } else {
                    if (currentValue !== newValue) {
                        effect(newValue, immutableNewState)
                    }
                }
            }
        )
        store.state = immutableNewState
    }
    send(update(fromJS(initialState), { type: '@@INIT' }))
    const getState = () => store.state
    const subscribe = (pattern, effect) => {
        const subscription = List([List(pattern), effect])
        if (!store.subscriptions.includes(subscription)) {
            store.subscriptions = store.subscriptions.push(subscription)    
        }
    }
    const unsubscribe = (pattern, effect) => {
        const subscription = List([List(pattern), effect])
        const index = store.subscriptions.findIndex((x) => x.equals(subscription))
        if (index > -1) {
            store.subscriptions = store.subscriptions.delete(index)
        }
    }

    const dispatch = update !== undefined 
        ? (message) => send(update(store.state, message))
        : undefined
    
    return {
        dispatch,
        getState,
        subscribe,
        unsubscribe,
        send,
    }
}

module.exports = createStore