import { createStore, applyMiddleware, compose } from 'redux'
import Rehydration from '../Services/Rehydration'
import ReduxPersist from '../Config/ReduxPersist'
import { composeWithDevTools } from 'remote-redux-devtools'
import Config from '../Config/DebugConfig'
import createSagaMiddleware from 'redux-saga'
import ScreenTracking from './ScreenTrackingMiddleware'

// creates the store
export default (rootReducer, rootSaga) => {
  /* ------------- Redux Configuration ------------- */

  const middleware = []
  const enhancers = []

  /* ------------- Analytics Middleware ------------- */
  middleware.push(ScreenTracking)

  /* ------------- Saga Middleware ------------- */

  const sagaMonitor = Config.useReactotron ? console.tron.createSagaMonitor() : null
  const sagaMiddleware = createSagaMiddleware({ sagaMonitor })
  middleware.push(sagaMiddleware)

  /* ------------- Assemble Middleware ------------- */

  enhancers.push(applyMiddleware(...middleware))

  // if Reactotron is enabled (default for __DEV__), we'll create the store through Reactotron
  const createAppropriateStore = Config.useReactotron ? console.tron.createStore : createStore
  // Development mode with Redux DevTools support enabled.

  const composer = (Config.useReduxDevTools && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
    // Prevents Redux DevTools from re-dispatching all previous actions.
    shouldHotReload: false
  }) : compose;
  // const composer = Config.useReduxDevTools ? composeWithDevTools({hostname: 'remotedev.io'}) : compose

  const store = createAppropriateStore(rootReducer, composer(...enhancers))

  // configure persistStore and check reducer version number
  if (ReduxPersist.active) {
    Rehydration.updateReducers(store)
  }

  // kick off root saga
  let sagasManager = sagaMiddleware.run(rootSaga)

  return {
    store,
    sagasManager,
    sagaMiddleware
  }
}
