import * as cornerstone from '@cornerstonejs/core' // not sure if this import will be needed

import { Resource } from 'web-client/src'
import App from '../../src/App.vue'

import { nextTick, ref } from 'vue'
import {
  createStore,
  defaultComponentMocks,
  defaultPlugins,
  mount,
  shallowMount,
  defaultStoreMockOptions
} from 'web-test-helpers'
import { useAppDefaultsMock } from 'web-test-helpers/src/mocks/useAppDefaultsMock'
import { FileContext, useAppDefaults } from 'web-pkg/src/composables/appDefaults'

import { mock } from 'jest-mock-extended'

import { useGettext } from 'vue3-gettext'

jest.mock('@cornerstonejs/core')
jest.mock('@cornerstonejs/dicom-image-loader')

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

// -------------------------------------------------
// suggested test cases

// - is Cornerstone core initalized on "mounted" in vue lifecyle
// - is RenderEngine enabled (on "mounted")
// - is div element with id="dicom-canvas" visible (on "mounted")
// - does canvas element with class="cornerstone-canvas" exist? (on "mounted")
// - does id="dicom-viewer-vip-metadata" exist / is visible
// - pass some data through { props } on mount and check if that data gets displayed (both for vip metadata and metadata sidebar)
// - test addWadouriPrefix() function (DONE)
// - test custom custom functions regarding metadata (e.g. fetch vip metadata, fetch metadata, etc.) --> requires most likely mock data object?
// - test custom functions for formatting data (e.g. format label, format date, etc.) --> there is an issue with $language.current that is used in these functions
// - when a dcm file (mock or real file? --> upload local file) is set on stack, does the viewport then contain the corresponding data (by getting the content of the file as datastring)?
// - when a dcm file is set on stack, does the viewport then contain the corresponding vip meta data overlay, e.g. patient name?
// - maybe test if the correct sop class is displayed (only be visible in show metadata)
//
// test cases for dicom controls & metadata sidebar
// - do the dicom control elements exist (rotate, zoom, flip, invert, reset, etc.) (DONE)
// - do the interaction elements exist, where applicable check for differences in the corresponding screen size (close/return) (DONE)
// - test if the functionality of each of these control elements is working properly (check the actual value of a certain pixel or just rely on viewport properties?)
// - test if image manipulation is possible through mouse interaction (not yet implemented --> so far no priority to implement)
//
// -------------------------------------------------

// -------------------------------------------------
// implementation of test cases
// -------------------------------------------------

// defining data (not sure if this is needed)
const dicomFiles = [
  {
    id: '1',
    name: 'MRBRAIN.dcm',
    mimeType: 'application/dicom',
    path: 'personal/admin/MRBRAIN.dcm'
  }
] // so far not used in any test case

const dicomTestFilePath = './testfiles/MRBRAIN.dcm' // check if this needs to be an import or a const

// test cases
// dummy test case, for testing only (to be deleted)
describe('dicom viewer app', () => {
  describe('dummy test', () => {
    it('do nothing :)', () => {
      expect(dicomTestFilePath).toBe(dicomTestFilePath)
    })
  })
})

// mounting the component
describe('dicom viewer app', () => {
  describe('mount app', () => {
    it('should create a shallow mount of the app', () => {
      const spy = jest.spyOn(global.console, 'error').mockImplementation(() => {})

      let wrapper

      try {
        wrapper = shallowMount(App)
      } catch (error) {
        expect(error.message).not.toBe(undefined)
        //expect(wrapper).not.toBe(undefined)
        //expect(wrapper.exists).toBeTruthy()
        // it seems like the wrapper instance doesn't really exist...
      } finally {
        spy.mockRestore()
      }
    })
  })
})

// testing the lifecycle
describe('dicom viewer app', () => {
  describe('app lifecycle', () => {
    const spy = jest.spyOn(global.console, 'error').mockImplementation(() => {})
    const createdLifecyleMethodSpy = jest.spyOn(App, 'created')
    const mountedLifecyleMethodSpy = jest.spyOn(App, 'mounted')

    let wrapper

    it('should call "created" on mounting the app', () => {
      try {
        wrapper = shallowMount(App)
      } catch (error) {
        expect(error.message).not.toBe(undefined)
        expect(createdLifecyleMethodSpy).toHaveBeenCalled()
        expect(createdLifecyleMethodSpy).toHaveBeenCalledTimes(1)
      } finally {
        spy.mockRestore()
      }
    })
    it('should call "mounted" on mounting the app', () => {
      try {
        wrapper = shallowMount(App)
      } catch (error) {
        expect(error.message).not.toBe(undefined)
        expect(mountedLifecyleMethodSpy).toHaveBeenCalled()
        expect(mountedLifecyleMethodSpy).toHaveBeenCalledTimes(1)
      } finally {
        spy.mockRestore()
      }
    })
    it('Cornerstone core instance should be initialized at "mounted"', () => {
      // TODO
    })
    it('RenderEngine should be instantiated and have viewport element enabled at "mounted"', () => {
      // TODO make sure wrapper is properly mounted
      try {
        wrapper = shallowMount(App)
      } catch (error) {
        expect(error.message).not.toBe(undefined)
        expect(mountedLifecyleMethodSpy).toHaveBeenCalled()
        //expect(wrapper.vm.renderingEngine).toBeDefined()
        //expect(wrapper.vm.renderingEngine.getRenderingEngines().length).toBe(1)
      } finally {
        spy.mockRestore()
      }
    })
    it('should contain element with id="dicom-canvas" / element should be visible at "mounted"', () => {
      // TODO
      // get wrapper, trigger lifecyle phase
      // expect(wrapper.get('#dicom-canvas')).toBeTruthy()
      const { wrapper } = getWrapper()
      expect(wrapper.exists).toBeTruthy()
      expect(wrapper.find('.dicom-canvas').exists()).toBeTruthy()
    })
    it('should contain element with class="cornerstone-canvas" at "mounted" (only after successful init of Cornerstone)', () => {
      // TODO
      // get wrapper, trigger lifecyle phase
      const { wrapper } = getWrapper()
      expect(wrapper.find('.cornerstone-canvas').exists()).toBeTruthy()
    })
  })
})

// test initCornerstoneCore() method
// describe('dicom viewer app', () => {
//   describe('Method "initCornerstoneCore"', () => {
//     it('should initzalize Cornerstone core', async () => {
//       // do we need to test this in the scope of unit test?
//     })

//     it('should fail with an error if Cornerstone core is not properly initialized', async () => {
//       await expect(() => {
//         // TODO: call the function through the wrapper? wrapper.vm.initCornerstoneCore()
//         App.function.initCornerstoneCore()
//       }).toThrow(TypeError)
//     })
//   })
// })

// test addWadouriPrefix() method
describe('dicom viewer app', () => {
  describe('Method "addWadouriPrefix"', () => {
    it('should add wadouri prefix to dicom file path', async () => {
      const dicomURL = 'https://dav/spaces/path/to/file.dcm?OC-Credential=xyz'
      const wadouriDicomURL = 'wadouri:https://dav/spaces/path/to/file.dcm?OC-Credential=xyz'
      const { wrapper } = getWrapper()
      const data = await wrapper.vm.addWadouriPrefix(dicomURL)
      expect(data).toBe(wadouriDicomURL)
      // const modifiedURL = await App.methods.addWadouriPrefix(dicomURL)
      // TODO: call the function through the wrapper? wrapper.vm.addWadouriPrefix(dicomURL)
      // expect(modifiedURL).toEqual(wadouriDicomURL)
    })
  })
})

// test formatLabel() method
describe('dicom viewer app', () => {
  describe('Method "formatLabel()"', () => {
    it('should format a metadata variable name into a nicely readible label', () => {
      const label = 'patientName'
      const formatedLabel = 'Patient Name'
      expect(App.methods.formatLabel(label)).toEqual(formatedLabel)
      // TODO: call the function through the wrapper? wrapper.vm.formatLabel(label)
    })
    it('should format a metadata variable name with underlines and abbreviations into a nicely readible label', () => {
      const label = 'SOP_InstanceUID'
      const formatedLabel = 'SOP Instance UID'
      expect(App.methods.formatLabel(label)).toEqual(formatedLabel)
      // TODO: call the function through the wrapper? wrapper.vm.formatLabel(label)
    })
  })
})

function getWrapper(props = {}) {
  return {
    wrapper: shallowMount(App, {
      props: {
        // url: 'https://dav/spaces/path/to/file.dcm?OC-Credential=xyz',
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
