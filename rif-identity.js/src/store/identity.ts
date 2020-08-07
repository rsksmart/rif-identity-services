import { combineReducers, configureStore, getDefaultMiddleware, ReducersMapObject, Reducer } from '@reduxjs/toolkit'
import thunk from 'redux-thunk'
import identityReducer from '../reducer/identityReducer'

const createReducer = (reducers: ReducersMapObject) => combineReducers(Object.assign({}, {
  identity: identityReducer
}, reducers))

export const configureIdentityStore = (reducers: ReducersMapObject) => configureStore({
  reducer: createReducer(reducers),
  middleware: [...getDefaultMiddleware(), thunk]
})

export type RootIdentityState = ReturnType<ReturnType<typeof createReducer>>
export type IdentityState = ReturnType<typeof identityReducer>
