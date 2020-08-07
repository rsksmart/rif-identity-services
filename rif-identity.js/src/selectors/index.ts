import { createSelector } from 'reselect'
import { selectIdentitiesReducer } from '../selectors/identity'
import { selectIdentities as _selectIdentities } from '../reducer/identityReducer'

export const selectIdentities = createSelector(
  selectIdentitiesReducer,
  _selectIdentities
)
