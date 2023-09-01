import { mount } from '@vue/test-utils'
import DicomViewer from '../../src/DicomViewer.vue'
// const DicomViewer = require('../../src/DicomViewer.vue')

// describe('DicomViewer.veu', () => {
//   test('is a Veu instance', () => {
//     expect(true).toBe(true)
//   })
// })

// describe('DicomViewer.veu', () => {
//   test('is a Veu instance', () => {
//     const wrapper = mount(DicomViewer, {
//       propsData: {
//         viewer: {
//           name: 'viewer',
//           completed: false
//         }
//       }
//     })
//     expect(wrapper.isVisible()).toBeTruthy()
//   })
// })

describe('DicomViewer', () => {
  it('has data', () => {
    const wrapper = mount(DicomViewer)
    wrapper.vm.initCornerstoneCore()
    // const test = DicomViewer.initCornerstoneCore();
    // console.log(test);

    console.log('testing')

    // expect(typeof DicomViewer.data).toBe('function')
  })
})
