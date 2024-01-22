import { defaultComponentMocks, defaultPlugins, defaultStubs, mount } from 'web-test-helpers'
import { mock } from 'jest-mock-extended'
import { Resource, SpaceResource } from '@ownclouders/web-client/src/helpers'
import ContextActions from '../../../../src/components/FilesList/ContextActions.vue'

import {
  useFileActionsAcceptShare,
  useFileActionsCopyQuickLink,
  useFileActionsRename,
  useFileActionsCopy
} from '../../../../src/composables'
import { computed } from 'vue'
import { Action } from '../../../../src/composables/actions'

// jest.mock('../../../../src/composables/actions/files', () =>
//   createMockActionComposables(jest.requireActual('../../../../src/composables/actions/files'))
// )

// jest.mock('../../../../src/composables/actions/files/useFileActionsSetReadme', () =>
//   createMockActionComposables(
//     jest.requireActual('../../../../src/composables/actions/files/useFileActionsSetReadme')
//   )
// )

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('ContextActions', () => {
  describe('menu sections', () => {
    it('do not render when no action enabled', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.findAll('action-menu-item-stub').length).toBe(0)
    })

    it('render enabled actions', () => {
      const enabledComposables = [
        useFileActionsAcceptShare,
        useFileActionsCopyQuickLink,
        useFileActionsRename,
        useFileActionsCopy
      ]
      for (const composable of enabledComposables) {
        jest.mocked(composable).mockImplementation(() => ({
          actions: computed(() => [mock<Action>({ isEnabled: () => true })])
        }))
      }

      const { wrapper } = getWrapper()
      expect(wrapper.findAll('action-menu-item-stub').length).toBe(enabledComposables.length)
    })
  })
})

function getWrapper() {
  const mocks = {
    ...defaultComponentMocks()
  }
  return {
    mocks,
    wrapper: mount(ContextActions, {
      props: {
        actionOptions: {
          space: mock<SpaceResource>(),
          resources: [mock<Resource>()]
        }
      },
      global: {
        mocks,
        provide: { ...mocks, currentSpace: mock<SpaceResource>() },
        stubs: { ...defaultStubs, 'action-menu-item': true },
        plugins: [...defaultPlugins()]
      }
    })
  }
}
