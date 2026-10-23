import AutoComplete from './AutoComplete.vue'
import { withInstall } from '../../utils/install'
export type { AutoCompleteOption, AutoCompleteQueryContext, AutoCompleteResult, AutoCompleteFetchSuggestions, AutoCompleteProps, AutoCompleteSlots, AutoCompleteExpose } from './types'
export default withInstall(AutoComplete)