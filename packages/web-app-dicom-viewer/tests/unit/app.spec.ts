import * as cornerstone from '@cornerstonejs/core' // not sure if this import will be needed

import { Resource } from 'web-client/src'
import App from '../../src/App.vue'

import { nextTick, ref } from 'vue'
import {
  createStore,
  defaultComponentMocks,
  defaultPlugins,
  shallowMount,
  defaultStoreMockOptions
} from 'web-test-helpers'
import { useAppDefaultsMock } from 'web-test-helpers/src/mocks/useAppDefaultsMock'
import { FileContext, useAppDefaults } from 'web-pkg/src/composables/appDefaults'

import { mock } from 'jest-mock-extended'

// -------------------------------------------------
// suggested test cases

// - is Cornerstone core initalized on "mounted" in vue lifecyle
// - is RenderEngine enabled (on "mounted")
// - is div element with id="dicom-canvas" visible (on "mounted")
// - does canvas element with class="cornerstone-canvas" exist? (on "mounted")
// - test addWadouriPrefix() function (DONE)
// - test custom custom functions regarding metadata (e.g. fetch vip metadata, fetch metadata, etc.)
// - test custom functions for formatting data (e.g. format label, format date, etc.)
// - when a dcm file (mock or real file? --> upload local file) is set on stack, does the viewport then contain the corresponding data (by getting the content of the file as datastring)?
// - when a dcm file is set on stack, does the viewport then contain the corresponding vip meta data overlay, e.g. patient name?
// - maybe test if the correct sop class is displayed (only be visible in show metadata)
//
// -------------------------------------------------
// more test cases for controls
// - do the controls exist (rotate, zoom, flip, invert, reset, etc.) (DONE)
// - test if the functionality of each of these controls is working properly (check the value of a certain pixel?)
// - test if image manipulation is possible through mouse interaction (not yet implemented --> no priority to implement)
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

// test initCornerstoneCore() method
describe('dicom viewer app', () => {
  describe('Method "initCornerstoneCore"', () => {
    it('should initzalize Cornerstone core', async () => {
      // do we need to test this in the scope of unit test?
    })

    it('should fail with an error if Cornerstone core is not properly initialized', async () => {
      await expect(() => {
        App.function.initCornerstoneCore()
      }).toThrow(TypeError)
    })
  })
})

// test addWadouriPrefix() method
describe('dicom viewer app', () => {
  describe('Method "addWadouriPrefix"', () => {
    it('should add wadouri prefix to dicom file path', async () => {
      const dicomURL = 'https://dav/spaces/path/to/file.dcm?OC-Credential=xyz'
      const wadouriDicomURL = 'wadouri:https://dav/spaces/path/to/file.dcm?OC-Credential=xyz'
      const modifiedURL = await App.methods.addWadouriPrefix(dicomURL)
      expect(modifiedURL).toEqual(wadouriDicomURL)
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
    })
    it('should format a metadata variable name with underlines and abbreviations into a nicely readible label', () => {
      const label = 'SOP_InstanceUID'
      const formatedLabel = 'SOP Instance UID'
      expect(App.methods.formatLabel(label)).toEqual(formatedLabel)
    })
  })
})

function getWrapper(props = {}) {
  return {
    wrapper: shallowMount(App, {
      props: {
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
