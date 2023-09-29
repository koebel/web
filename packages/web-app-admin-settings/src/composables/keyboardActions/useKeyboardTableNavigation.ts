import { useScrollTo } from 'web-app-admin-settings/src/composables/scrollTo'
import { Ref, unref } from 'vue'
import { Key, KeyboardActions, ModifierKey } from 'web-pkg/src/composables/keyboardActions'
import { find, findIndex } from 'lodash-es'

export const useKeyboardTableNavigation = (
  keyActions: KeyboardActions,
  paginatedResources: Ref<{ id: string }[]>,
  selectedRows: any,
  lastSelectedRowIndex: Ref<number>,
  lastSelectedRowId: Ref<string | null>
) => {
  const { scrollToResource } = useScrollTo()

  keyActions.bindKeyAction({ primary: Key.ArrowUp }, () => handleNavigateAction(true))

  keyActions.bindKeyAction({ primary: Key.ArrowDown }, () => handleNavigateAction())

  keyActions.bindKeyAction({ modifier: ModifierKey.Shift, primary: Key.ArrowUp }, async () =>
    handleShiftUpAction()
  )

  keyActions.bindKeyAction({ modifier: ModifierKey.Shift, primary: Key.ArrowDown }, () =>
    handleShiftDownAction()
  )

  keyActions.bindKeyAction({ modifier: ModifierKey.Ctrl, primary: Key.A }, () =>
    handleSelectAllAction()
  )

  keyActions.bindKeyAction({ primary: Key.Space }, () => {
    const { lastSelectedRow, lastSelectedRowIndex } = getLastSelectedRow()
    if (lastSelectedRowIndex === -1) {
      selectedRows.push(lastSelectedRow)
    } else {
      selectedRows.splice(lastSelectedRowIndex, 1)
    }
  })

  keyActions.bindKeyAction({ primary: Key.Esc }, () => {
    keyActions.resetSelectionCursor()
    selectedRows.splice(0, selectedRows.length)
  })

  const handleNavigateAction = async (up = false) => {
    const nextResource = !lastSelectedRowId ? getFirstResource() : getNextResource(up)

    if (nextResource === -1) {
      return
    }

    const nextResourceIndex = findIndex(
      paginatedResources.value,
      (resource) => resource.id === nextResource.id
    )

    keyActions.resetSelectionCursor()
    selectedRows.splice(0, selectedRows.length, nextResource)
    lastSelectedRowIndex.value = nextResourceIndex
    lastSelectedRowId.value = String(nextResource.id)

    scrollToResource(nextResource.id)
  }

  const handleShiftUpAction = async () => {
    const nextResource = getNextResource(true)
    if (nextResource === -1) {
      return
    }

    const nextResourceIndex = findIndex(
      paginatedResources.value,
      (resource) => resource.id === nextResource.id
    )

    if (unref(keyActions.selectionCursor) > 0) {
      const { lastSelectedRow, lastSelectedRowIndex } = getLastSelectedRow()

      lastSelectedRowIndex === -1
        ? selectedRows.push(lastSelectedRow)
        : selectedRows.splice(lastSelectedRowIndex, 1)
    } else {
      selectedRows.push(nextResource)
    }

    lastSelectedRowIndex.value = nextResourceIndex
    lastSelectedRowId.value = String(nextResource.id)
    keyActions.selectionCursor.value = unref(keyActions.selectionCursor) - 1
    scrollToResource(nextResource.id)
  }
  const handleShiftDownAction = () => {
    const nextResource = getNextResource(false)
    if (nextResource === -1) {
      return
    }

    const nextResourceIndex = findIndex(
      paginatedResources.value,
      (resource) => resource.id === nextResource.id
    )

    if (unref(keyActions.selectionCursor) < 0) {
      const lastSelectedRow = find(
        paginatedResources.value,
        (resource) => resource.id === lastSelectedRowId.value
      )
      const lastSelectedRowIndex = findIndex(
        selectedRows,
        (resource: any) => resource.id === lastSelectedRowId.value
      )

      if (lastSelectedRowIndex === -1) {
        selectedRows.push(lastSelectedRow)
      } else {
        selectedRows.splice(lastSelectedRowIndex, 1)
      }
    } else {
      selectedRows.push(nextResource)
    }

    lastSelectedRowIndex.value = nextResourceIndex
    lastSelectedRowId.value = String(nextResource.id)
    keyActions.selectionCursor.value = unref(keyActions.selectionCursor) + 1
    scrollToResource(nextResource.id)
  }

  const handleSelectAllAction = () => {
    keyActions.resetSelectionCursor()
    selectedRows.splice(0, selectedRows.length, ...paginatedResources.value)
  }

  const getNextResource = (previous = false) => {
    const latestSelectedResourceIndex = paginatedResources.value.findIndex(
      (resource) => resource.id === lastSelectedRowId.value
    )
    if (latestSelectedResourceIndex === -1) {
      return -1
    }
    const nextResourceIndex = latestSelectedResourceIndex + (previous ? -1 : 1)
    if (nextResourceIndex < 0 || nextResourceIndex >= paginatedResources.value.length) {
      return -1
    }
    return paginatedResources.value[nextResourceIndex]
  }

  const getFirstResource = () => {
    return paginatedResources.value.length ? paginatedResources.value[0] : -1
  }

  const getLastSelectedRow = () => {
    const lastSelectedRow = find(
      paginatedResources.value,
      (resource) => resource.id === lastSelectedRowId.value
    )
    const lastSelectedRowIndex = findIndex(
      selectedRows,
      (resource: any) => resource.id === lastSelectedRowId.value
    )
    return {
      lastSelectedRow,
      lastSelectedRowIndex
    }
  }
}
