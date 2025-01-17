import { errors, Page } from 'playwright'
import util from 'util'

const acceptedShareItem =
  '//*[@data-test-resource-name="%s"]/ancestor::tr//span[@data-test-user-name="%s"]'
const itemSelector = '.files-table [data-test-resource-name="%s"]'

export const resourceIsNotOpenable = async ({
  page,
  resource
}: {
  page: Page
  resource: string
}): Promise<boolean> => {
  const resourceLocator = page.locator(util.format(itemSelector, resource))
  try {
    await Promise.all([
      page.waitForRequest((req) => req.method() === 'PROPFIND', { timeout: 500 }),
      resourceLocator.click()
    ])
    return false
  } catch (e) {
    return true
  }
}

export const isAcceptedSharePresent = async ({
  page,
  resource,
  owner,
  timeout = 500
}: {
  page: Page
  resource: string
  owner: string
  timeout?: number
}): Promise<boolean> => {
  let exist = true
  await page
    .locator(util.format(acceptedShareItem, resource, owner))
    .waitFor({ timeout })
    .catch((e) => {
      if (!(e instanceof errors.TimeoutError)) {
        throw e
      }

      exist = false
    })

  return exist
}
