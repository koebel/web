import { computed, ComputedRef, unref } from 'vue'
import { MaybeRef } from 'web-pkg/src/utils'
import {
  queryItemAsString,
  useRouteQuery,
  useRouteQueryPersisted,
  PaginationConstants
} from 'web-pkg/src/composables'
import { eventBus } from 'web-pkg/src/services/eventBus'
import { findIndex } from 'lodash-es'
import { useRoute, useRouter } from 'vue-router'

interface PaginationOptions<T> {
  items: MaybeRef<Array<T>>
  page?: MaybeRef<number>
  perPage?: MaybeRef<number>
  perPageDefault?: string
  perPageQueryName?: string
  perPageStoragePrefix: string
}

interface PaginationResult<T> {
  items: ComputedRef<Array<T>>
  total: ComputedRef<number>
  page: ComputedRef<number>
  perPage: ComputedRef<number>
}

export function usePagination<T>(options: PaginationOptions<T>): PaginationResult<T> {
  const router = useRouter()
  const route = useRoute()
  const page = createPageRef<T>(options)
  const perPage = createPerPageRef<T>(options)
  const total = computed(() => {
    return Math.ceil(unref(options.items).length / unref(perPage)) || 1
  })
  const items = computed(() => {
    if (!unref(perPage)) {
      return unref(options.items)
    }

    const start = (unref(page) - 1) * unref(perPage)
    const end = start + unref(perPage)

    return unref(options.items).slice(start, end)
  })

  eventBus.subscribe(
    'app.files.navigate.page',
    ({ resourceId, forceScroll }: { resourceId: string; forceScroll: boolean }) => {
      const index = findIndex(unref(options.items), (item: any) => item.id === resourceId)
      if (index >= 0) {
        const page = Math.ceil((index + 1) / Number(unref(perPage)))
        router.push({ ...unref(route), query: { ...unref(route).query, page } }).then(() => {
          eventBus.publish('app.files.navigate.scrollTo', { resourceId, forceScroll })
        })
      }
    }
  )

  return {
    items,
    total,
    page,
    perPage
  }
}

function createPageRef<T>(options: PaginationOptions<T>): ComputedRef<number> {
  if (options.page) {
    return computed(() => unref(options.page))
  }

  const pageQuery = useRouteQuery('page', '1')
  return computed(() => parseInt(queryItemAsString(unref(pageQuery))))
}

function createPerPageRef<T>(options: PaginationOptions<T>): ComputedRef<number> {
  if (options.perPage) {
    return computed(() => unref(options.perPage))
  }

  const perPageQuery = useRouteQueryPersisted({
    name: options.perPageQueryName || PaginationConstants.perPageQueryName,
    defaultValue: options.perPageDefault || PaginationConstants.perPageDefault,
    storagePrefix: options.perPageStoragePrefix
  })
  return computed(() => parseInt(queryItemAsString(unref(perPageQuery))))
}
