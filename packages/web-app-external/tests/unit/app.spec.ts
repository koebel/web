import { mock } from 'jest-mock-extended'
import {
  createStore,
  defaultPlugins,
  defaultStoreMockOptions,
  shallowMount
} from 'web-test-helpers'
import { useRequest, useRouteQuery } from 'web-pkg/src/composables'
import { ref } from 'vue'

import { Resource } from 'web-client'
import App from '../../src/App.vue'

jest.mock('web-pkg/src/composables/authContext/useRequest')
jest.mock('web-pkg/src/composables/router/useRouteQuery')

const appUrl = 'https://example.test/d12ab86/loe009157-MzBw'

const providerSuccessResponsePost = {
  app_url: appUrl,
  method: 'POST',
  form_parameters: {
    access_token: 'asdfsadfsadf',
    access_token_ttl: '123456'
  }
}

const providerSuccessResponseGet = {
  app_url: appUrl,
  method: 'GET'
}

describe('The app provider extension', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fail for unauthenticated users', async () => {
    const makeRequest = jest.fn().mockResolvedValue({
      ok: true,
      status: 401,
      message: 'Login Required'
    })
    const { wrapper } = createShallowMountWrapper(makeRequest)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toMatchSnapshot()
  })
  it('should be able to load an iFrame via get', async () => {
    const makeRequest = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      data: providerSuccessResponseGet
    })

    const { wrapper } = createShallowMountWrapper(makeRequest)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toMatchSnapshot()
  })
  it('should be able to load an iFrame via post', async () => {
    const makeRequest = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      data: providerSuccessResponsePost
    })
    const { wrapper } = createShallowMountWrapper(makeRequest)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toMatchSnapshot()
  })
})

function createShallowMountWrapper(makeRequest = jest.fn().mockResolvedValue({ status: 200 })) {
  jest.mocked(useRequest).mockImplementation(() => ({
    makeRequest
  }))

  jest.mocked(useRouteQuery).mockImplementation(() => ref('example-app'))

  const storeOptions = defaultStoreMockOptions
  storeOptions.getters.capabilities.mockImplementation(() => ({
    files: {
      app_providers: [
        {
          apps_url: '/app/list',
          enabled: true,
          open_url: '/app/open'
        }
      ]
    }
  }))

  const store = createStore(storeOptions)

  return {
    wrapper: shallowMount(App, {
      props: {
        resource: mock<Resource>()
      },
      global: {
        plugins: [...defaultPlugins(), store]
      }
    })
  }
}
