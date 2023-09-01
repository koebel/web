import { shallowMount } from '@vue/test-utils'
import DicomViewer from '../../src/DicomViewer.vue'

const dicomTestFilePath = './testfiles/MRBRAIN.dcm' // check if this needs to be an import or a const
const dicomURL = 'https://dav/spaces/path/to/file.dcm?OC-Credential=xyz'

describe('DicomViewer.veu', () => {
  test('is a Veu instance', () => {
    const spyCornerstoneInit = jest
      .spyOn(DicomViewer.methods, 'initCornerstoneCore')
      .mockImplementation(() => jest.fn())

    const wrapper = shallowMount(DicomViewer, {
      propsData: {
        url: dicomURL,
        currentContent: true,
        resource: dicomTestFilePath
      }
    })

    expect(wrapper.isVisible()).toBeTruthy()
  })
})
