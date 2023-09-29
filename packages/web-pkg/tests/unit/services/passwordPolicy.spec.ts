import { PasswordPolicyService } from '../../../src/services'
import { createStore, defaultStoreMockOptions } from 'web-test-helpers'
import { Language } from 'vue3-gettext'
import { PasswordPolicyCapability } from 'web-client/src/ocs/capabilities'

describe('PasswordPolicyService', () => {
  describe('policy', () => {
    describe('contains the rules according to the capability', () => {
      it.each([
        [{} as PasswordPolicyCapability, ['mustNotBeEmpty']],
        [{ min_characters: 2 } as PasswordPolicyCapability, ['atLeastCharacters']],
        [
          { min_lowercase_characters: 2 } as PasswordPolicyCapability,
          ['atLeastLowercaseCharacters']
        ],
        [
          { min_uppercase_characters: 2 } as PasswordPolicyCapability,
          ['atLeastUppercaseCharacters']
        ],
        [{ min_digits: 2 } as PasswordPolicyCapability, ['atLeastDigits']],
        [{ min_digits: 2 } as PasswordPolicyCapability, ['atLeastDigits']],
        [{ min_special_characters: 2 } as PasswordPolicyCapability, ['mustContain']],
        [
          { max_characters: 72 } as PasswordPolicyCapability,
          ['mustNotBeEmpty', 'atMostCharacters']
        ],
        [
          {
            min_characters: 2,
            min_lowercase_characters: 2,
            min_uppercase_characters: 2,
            min_digits: 2,
            min_special_characters: 2,
            max_characters: 72
          } as PasswordPolicyCapability,
          [
            'atLeastCharacters',
            'atLeastUppercaseCharacters',
            'atLeastLowercaseCharacters',
            'atLeastDigits',
            'mustContain',
            'atMostCharacters'
          ]
        ]
      ])('capability "%s"', (capability: PasswordPolicyCapability, expected: Array<string>) => {
        const { passwordPolicyService } = getWrapper(capability)
        expect(Object.keys((passwordPolicyService.getPolicy() as any).rules)).toEqual(expected)
      })
    })
    describe('method "check"', () => {
      describe('test the password correctly against te defined rules', () => {
        it.each([
          [{} as PasswordPolicyCapability, ['', 'o'], [false, true]],
          [
            { min_characters: 2 } as PasswordPolicyCapability,
            ['', 'o', 'ow', 'ownCloud'],
            [false, false, true, true]
          ],
          [
            { min_lowercase_characters: 2 } as PasswordPolicyCapability,
            ['', 'o', 'oWNCLOUD', 'ownCloud'],
            [false, false, false, true]
          ],
          [
            { min_uppercase_characters: 2 } as PasswordPolicyCapability,
            ['', 'o', 'ownCloud', 'ownCLoud'],
            [false, false, false, true]
          ],
          [
            { min_digits: 2 } as PasswordPolicyCapability,
            ['', '1', 'ownCloud1', 'ownCloud12'],
            [false, false, false, true]
          ],
          [
            { min_special_characters: 2 } as PasswordPolicyCapability,
            ['', '!', 'ownCloud!', 'ownCloud!#'],
            [false, false, false, true]
          ],
          [
            { max_characters: 2 } as PasswordPolicyCapability,
            ['ownCloud', 'ownC', 'ow', 'o'],
            [false, false, true, true]
          ],
          [
            {
              min_characters: 8,
              min_lowercase_characters: 2,
              min_uppercase_characters: 2,
              min_digits: 2,
              min_special_characters: 2,
              max_characters: 72
            } as PasswordPolicyCapability,
            ['öwnCloud', 'öwnCloudää', 'öwnCloudää12', 'öwnCloudäÄ12#!'],
            [false, false, false, true]
          ]
        ])(
          'capability "%s, passwords "%s"',
          (
            capability: PasswordPolicyCapability,
            passwords: Array<string>,
            expected: Array<boolean>
          ) => {
            const { passwordPolicyService } = getWrapper(capability)
            const policy = passwordPolicyService.getPolicy()
            for (let i = 0; i < passwords.length; i++) {
              expect((policy as any).check(passwords[i])).toEqual(expected[i])
            }
          }
        )
      })
    })
  })
})

const getWrapper = (capability: PasswordPolicyCapability) => {
  const storeOptions = defaultStoreMockOptions
  storeOptions.getters.capabilities.mockReturnValue({
    password_policy: capability
  })
  const store = createStore(storeOptions)
  return {
    passwordPolicyService: new PasswordPolicyService({
      store,
      language: { current: 'en' } as Language
    })
  }
}
