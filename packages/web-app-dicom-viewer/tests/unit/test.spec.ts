import App from '../../src/App.vue'
import { defaultPlugins, mount, shallowMount } from 'web-test-helpers'

jest.mock('@cornerstonejs/core', () => ({
  successCallback: jest.fn(),
  errorCallback: jest.fn(),
  RenderingEngine: class RenderingEngine {
    getViewport() {}
    enableElement() {}
  },
  Types: jest.fn(),
  Enums: jest.fn(),
  metaData: jest.fn(),
  init: jest.fn(),
  getConfiguration: jest.fn().mockImplementation(() => {
    return { rendering: '' }
  }),
  registerImageLoader: jest.fn(),
  isCornerstoneInitialized: jest.fn()
}))

jest.mock('@cornerstonejs/dicom-image-loader', () => ({
  wadouri: {
    loadImage: (imgId) => ({
      promise: Promise.resolve({})
    })
  },
  external: jest.fn(),
  configure: jest.fn(),
  // initialize: jest.fn().mockImplementation(() => {
  // return {
  //   maxWebWorkers: 1,
  //   startWebWorkersOnDemand: true,
  //   taskConfiguration: {
  //     decodeTask: {
  //       initializeCodecsOnStartup: true,
  //       strict: false // true
  //     }
  //   }
  // }
  // })
  webWorkerManager: {
    initialize: jest.fn().mockImplementation(() => {})
  }
}))

const dicomCanvas = '.dicom-canvas'

describe('MyComponent', () => {
  it('initializes cornerstone if not already initialized', async () => {
    console.log('passed')
    const fetchVipMetadataInformation = jest
      .spyOn(App.methods, 'fetchVipMetadataInformation')
      .mockImplementation()
    const fetchMetadataInformation = jest
      .spyOn(App.methods, 'fetchMetadataInformation')
      .mockImplementation()

    const { wrapper } = getWrapper()
    expect(wrapper.exists).toBeTruthy()
    expect(wrapper.find(dicomCanvas).exists()).toBeTruthy()
    // expect(wrapper.get('#dicom-canvas')).toBeTruthy()
  })
})

function getWrapper(props = {}) {
  return {
    wrapper: shallowMount(App, {
      props: {
        url: 'https://dav/spaces/path/to/file.dcm?OC-Credential=xyz',
        ...props
      },
      global: {
        plugins: [...defaultPlugins()]

        //mocks,
        //provide: mocks
      }
    })
  }
}
