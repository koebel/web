import { Page } from 'playwright'
import util from 'util'
import Collaborator, { ICollaborator } from './collaborator'
import { sidebar } from '../utils'
import { clickResource } from '../resource/actions'
import { copyLinkArgs, clearCurrentPopup } from '../link/actions'
import { config } from '../../../../config.js'
import { createdLinkStore } from '../../../store'

const filesSharedWithMeAccepted =
  '#files-shared-with-me-accepted-section [data-test-resource-name="%s"]'
const shareAcceptDeclineButton =
  '//*[@data-test-resource-name="%s"]/ancestor::tr//button[contains(@class, "file-row-share-%s")]'
const quickShareButton =
  '//*[@data-test-resource-name="%s"]/ancestor::tr//button[contains(@class, "files-quick-action-collaborators")]'
const noPermissionToShareLabel =
  '//*[@data-testid="files-collaborators-no-reshare-permissions-message"]'
const actionMenuDropdownButton =
  '//*[@data-test-resource-name="%s"]/ancestor::tr//button[contains(@class, "resource-table-btn-action-dropdown")]'
const actionsTriggerButton =
  '//*[@data-test-resource-name="%s"]/ancestor::tr//button[contains(@class, "oc-files-actions-%s-trigger")]'
const filesSharedWithMeDeclined =
  '#files-shared-with-me-declined-section [data-test-resource-name="%s"]'

const publicLinkInputField =
  '//h4[contains(@class, "oc-files-file-link-name") and text()="%s"]' +
  '/following-sibling::div//p[contains(@class,"oc-files-file-link-url")]'

export interface ShareArgs {
  page: Page
  resource: string
  recipients: ICollaborator[]
}

export const openSharingPanel = async function (
  page: Page,
  resource: string,
  via = 'SIDEBAR_PANEL'
): Promise<void> {
  const folderPaths = resource.split('/')
  const item = folderPaths.pop()

  if (folderPaths.length) {
    await clickResource({ page, path: folderPaths.join('/') })
  }

  switch (via) {
    case 'QUICK_ACTION':
      await page.locator(util.format(quickShareButton, item)).click()
      break

    case 'SIDEBAR_PANEL':
      await sidebar.open({ page, resource: item })
      await sidebar.openPanel({ page, name: 'sharing' })
      break
  }
}

/**/

export interface createShareArgs extends ShareArgs {
  via?: 'SIDEBAR_PANEL' | 'QUICK_ACTION'
}

export const createShare = async (args: createShareArgs): Promise<void> => {
  const { page, resource, recipients, via } = args

  await openSharingPanel(page, resource, via)
  await Collaborator.inviteCollaborators({ page, collaborators: recipients })

  await sidebar.close({ page })
}

/**/

export interface ShareStatusArgs extends Omit<ShareArgs, 'recipients'> {
  via?: 'STATUS' | 'CONTEXT_MENU'
}

export const acceptShare = async (args: ShareStatusArgs): Promise<void> => {
  const { resource, via, page } = args
  if (via === 'CONTEXT_MENU') {
    await clickActionInContextMenu({ page, resource }, 'accept-share')
  } else {
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('shares') &&
          resp.status() === 200 &&
          resp.request().method() === 'POST'
      ),
      page.locator(util.format(shareAcceptDeclineButton, resource, 'status-accept')).click()
    ])
  }
  await page.locator(util.format(filesSharedWithMeAccepted, resource)).waitFor()
}

export const declineShare = async (args: ShareStatusArgs): Promise<void> => {
  const { page, resource, via } = args
  if (via === 'CONTEXT_MENU') {
    await clickActionInContextMenu({ page, resource }, 'decline-share')
  } else {
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('shares') &&
          resp.status() === 200 &&
          resp.request().method() === 'DELETE'
      ),
      page.locator(util.format(shareAcceptDeclineButton, resource, 'decline')).click()
    ])
  }
  await page.locator(util.format(filesSharedWithMeDeclined, resource)).waitFor()
}

export const clickActionInContextMenu = async (
  args: ShareStatusArgs,
  action: string
): Promise<void> => {
  const { page, resource } = args
  let method = 'GET'
  switch (action) {
    case 'accept-share':
    case 'create-quicklink':
      method = 'POST'
      break
    case 'decline-share':
      method = 'DELETE'
      break
  }

  await page.locator(util.format(actionMenuDropdownButton, resource)).click()

  await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes('shares') && resp.status() === 200 && resp.request().method() === method
    ),
    page.locator(util.format(actionsTriggerButton, resource, action)).click()
  ])
}

export const changeShareeRole = async (args: ShareArgs): Promise<void> => {
  const { page, resource, recipients } = args
  await openSharingPanel(page, resource)

  for (const collaborator of recipients) {
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('shares') &&
          resp.status() === 200 &&
          resp.request().method() === 'PUT'
      ),
      Collaborator.changeCollaboratorRole({ page, collaborator })
    ])
  }
}

/**/

export interface removeShareeArgs extends ShareArgs {
  removeOwnSpaceAccess?: boolean
}

export const removeSharee = async (args: removeShareeArgs): Promise<void> => {
  const { page, resource, recipients, removeOwnSpaceAccess } = args
  await openSharingPanel(page, resource)

  for (const collaborator of recipients) {
    await Collaborator.removeCollaborator({ page, collaborator, removeOwnSpaceAccess })
  }
}

/**/

export const checkSharee = async (args: ShareArgs): Promise<void> => {
  const { resource, page, recipients } = args
  await openSharingPanel(page, resource)

  for (const collaborator of recipients) {
    await Collaborator.checkCollaborator({ page, collaborator })
  }
}

export const hasPermissionToShare = async (
  args: Omit<ShareArgs, 'recipients'>
): Promise<boolean> => {
  const { page, resource } = args
  // reload page to make sure the changes are reflected
  await page.reload()
  await openSharingPanel(page, resource)
  await Collaborator.waitForInvitePanel(page)
  return !(await page.isVisible(noPermissionToShareLabel))
}

export const copyQuickLink = async (args: copyLinkArgs): Promise<string> => {
  const { page, resource, via } = args
  let url = ''
  const linkName = 'Link'

  if (via === 'CONTEXT_MENU') {
    await clickActionInContextMenu({ page, resource }, 'create-quicklink')
  }

  if (config.backendUrl.startsWith('https')) {
    url = await page.evaluate(() => navigator.clipboard.readText())
  } else {
    const quickLinkUrlLocator = util.format(publicLinkInputField, linkName)
    if (!(await page.locator(quickLinkUrlLocator).isVisible())) {
      await openSharingPanel(page, resource)
    }
    url = await page.locator(quickLinkUrlLocator).textContent()
  }

  await clearCurrentPopup(page)

  if (url && !createdLinkStore.has(linkName)) {
    createdLinkStore.set(linkName, { name: linkName, url })
  }
  return url
}

export interface setDenyShareArgs {
  page: Page
  resource: string
  deny: boolean
  collaborator: ICollaborator
}

export const setDenyShare = async (args: setDenyShareArgs): Promise<void> => {
  const { page, resource, deny, collaborator } = args
  await openSharingPanel(page, resource)
  await Collaborator.setDenyShareForCollaborator({ page, deny, collaborator })
}
