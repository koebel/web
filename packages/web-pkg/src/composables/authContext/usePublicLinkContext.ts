import { computed } from 'vue'
import { Store } from 'vuex'

interface PublicLinkContextOptions {
  store: Store<any>
}

export const usePublicLinkContext = ({ store }: PublicLinkContextOptions) => {
  return computed((): boolean => {
    return store.getters['runtime/auth/isPublicLinkContextReady']
  })
}
