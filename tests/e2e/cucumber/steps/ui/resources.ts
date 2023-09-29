import { DataTable, When, Then } from '@cucumber/cucumber'
import path from 'path'
import { World } from '../../environment'
import { objects } from '../../../support'
import { expect } from '@playwright/test'
import { config } from '../../../config'
import { displayedResourceType } from '../../../support/objects/app-files/resource/actions'
import { Public } from '../../../support/objects/app-files/page/public'
import { Resource } from '../../../support/objects/app-files'
import * as runtimeFs from '../../../support/utils/runtimeFs'
import { searchFilter } from '../../../support/objects/app-files/resource/actions'

When(
  '{string} creates the following resource(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })

    for (const info of stepTable.hashes()) {
      await resourceObject.create({ name: info.resource, type: info.type, content: info.content })
    }
  }
)

When(
  '{string} uploads the following resource(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    for (const info of stepTable.hashes()) {
      await resourceObject.upload({
        to: info.to,
        resources: [this.filesEnvironment.getFile({ name: info.resource })],
        option: info.option
      })
    }
  }
)

When(
  '{string} starts uploading the following large resource(s) from the temp upload directory',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    for (const info of stepTable.hashes()) {
      await resourceObject.startUpload({
        to: info.to,
        resources: [
          this.filesEnvironment.getFile({
            name: path.join(runtimeFs.getTempUploadPath().replace(config.assets, ''), info.resource)
          })
        ],
        option: info.option
      })
    }
  }
)

When(
  '{string} {word} the file upload',
  async function (this: World, stepUser: string, action: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    switch (action) {
      case 'pauses':
        await resourceObject.pauseUpload()
        break
      case 'resumes':
        await resourceObject.resumeUpload()
        break
      case 'cancels':
        await resourceObject.cancelUpload()
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }
)

When(
  /^"([^"]*)" downloads the following resource(?:s)? using the (sidebar panel|batch action)$/,
  async function (this: World, stepUser: string, actionType: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await processDownload(stepTable, resourceObject, actionType)
  }
)

When(
  /^"([^"]*)" deletes the following resource(?:s)? using the (sidebar panel|batch action)$/,
  async function (this: World, stepUser: string, actionType: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await processDelete(stepTable, resourceObject, actionType)
  }
)

When(
  '{string} renames the following resource(s)',
  async function (this: World, stepUser: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    for (const { resource, as } of stepTable.hashes()) {
      await resourceObject.rename({ resource, newName: as })
    }
  }
)

When(
  /^"([^"]*)" (copies|moves) the following resource(?:s)? using (keyboard|drag-drop|drag-drop-breadcrumb|sidebar-panel|dropdown-menu)$/,
  async function (
    this: World,
    stepUser: string,
    actionType: string,
    method: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })

    for (const { resource, to } of stepTable.hashes()) {
      await resourceObject[actionType === 'copies' ? 'copy' : 'move']({
        resource,
        newLocation: to,
        method
      })
    }
  }
)

When(
  '{string} restores following resource(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    const fileInfo = stepTable.hashes().reduce((acc, stepRow) => {
      const { to, resource, version } = stepRow

      if (!acc[to]) {
        acc[to] = []
      }

      acc[to].push(this.filesEnvironment.getFile({ name: resource }))

      if (version !== '1') {
        throw new Error('restoring is only supported for the most recent version')
      }

      return acc
    }, {})

    for (const folder of Object.keys(fileInfo)) {
      await resourceObject.restoreVersion({ folder, files: fileInfo[folder] })
    }
  }
)

When(
  '{string} downloads old version of the following resource(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    const fileInfo = stepTable.hashes().reduce((acc, stepRow) => {
      const { to, resource } = stepRow

      if (!acc[to]) {
        acc[to] = []
      }

      acc[to].push(this.filesEnvironment.getFile({ name: resource }))

      return acc
    }, {})

    for (const folder of Object.keys(fileInfo)) {
      await resourceObject.downloadVersion({ folder, files: fileInfo[folder] })
    }
  }
)

Then(
  /^"([^"]*)" (should|should not) be able to delete following resource(?:s)? from the trashbin?$/,
  async function (
    this: World,
    stepUser: string,
    actionType: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    for (const info of stepTable.hashes()) {
      if (actionType === 'should') {
        const message = await resourceObject.deleteTrashBin({ resource: info.resource })
        const paths = info.resource.split('/')
        expect(message).toBe(`"${paths[paths.length - 1]}" was deleted successfully`)
      } else {
        await resourceObject.expectThatDeleteTrashBinButtonIsNotVisible({ resource: info.resource })
      }
    }
  }
)

Then(
  /^"([^"]*)" (should|should not) be able to restore following resource(?:s)? from the trashbin?$/,
  async function (
    this: World,
    stepUser: string,
    actionType: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    for (const info of stepTable.hashes()) {
      if (actionType === 'should') {
        const message = await resourceObject.restoreTrashBin({
          resource: info.resource
        })
        const paths = info.resource.split('/')
        expect(message).toBe(`${paths[paths.length - 1]} was restored successfully`)
      } else {
        await resourceObject.expectThatRestoreTrashBinButtonIsNotVisible({
          resource: info.resource
        })
      }
    }
  }
)

When(
  /^"([^"]*)" searches "([^"]*)" using the global search(?: and the "([^"]*)" filter)?( and presses enter)?$/,
  async function (
    this: World,
    stepUser: string,
    keyword: string,
    filter: string,
    command: string
  ): Promise<void> {
    keyword = keyword ?? ''
    const pressEnter = !!command && command.endsWith('presses enter')
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await resourceObject.searchResource({
      keyword,
      filter: filter as searchFilter,
      pressEnter
    })
  }
)

Then(
  /^following resources (should|should not) be displayed in the (search list|files list) for user "([^"]*)"$/,
  async function (
    this: World,
    actionType: string,
    listType: string,
    stepUser: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    const actualList = await resourceObject.getDisplayedResources({
      keyword: listType as displayedResourceType
    })
    for (const info of stepTable.hashes()) {
      expect(actualList.includes(info.resource)).toBe(actionType === 'should')
    }
  }
)

When(
  '{string} opens folder {string}',
  async function (this: World, stepUser: string, resource: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await resourceObject.openFolder(resource)
  }
)

When(
  '{string} enables the option to display the hidden file',
  async function (this: World, stepUser: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await resourceObject.showHiddenFiles()
  }
)

When(
  '{string} switches to the tiles-view',
  async function (this: World, stepUser: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await resourceObject.switchToTilesViewMode()
  }
)

When(
  '{string} sees the resources displayed as tiles',
  async function (this: World, stepUser: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await resourceObject.expectThatResourcesAreTiles()
  }
)

export const processDelete = async (
  stepTable: DataTable,
  pageObject: Public | Resource,
  actionType: string
) => {
  let files, parentFolder
  const deleteInfo = stepTable.hashes().reduce((acc, stepRow) => {
    const { resource, from } = stepRow
    const resourceInfo = {
      name: resource
    }
    if (!acc[from]) {
      acc[from] = []
    }
    acc[from].push(resourceInfo)
    return acc
  }, {})

  for (const folder of Object.keys(deleteInfo)) {
    files = deleteInfo[folder]
    parentFolder = folder !== 'undefined' ? folder : null
    await pageObject.delete({
      folder: parentFolder,
      resourcesWithInfo: files,
      via: actionType === 'batch action' ? 'BATCH_ACTION' : 'SIDEBAR_PANEL'
    })
  }
}

export const processDownload = async (
  stepTable: DataTable,
  pageObject: Public | Resource,
  actionType: string
) => {
  let downloads, files, parentFolder
  const downloadedResources = []
  const downloadInfo = stepTable.hashes().reduce((acc, stepRow) => {
    const { resource, from, type } = stepRow
    const resourceInfo = {
      name: resource,
      type: type
    }
    if (!acc[from]) {
      acc[from] = []
    }

    acc[from].push(resourceInfo)

    return acc
  }, {})

  for (const folder of Object.keys(downloadInfo)) {
    files = downloadInfo[folder]
    parentFolder = folder !== 'undefined' ? folder : null
    downloads = await pageObject.download({
      folder: parentFolder,
      resources: files,
      via:
        actionType === 'batch action'
          ? 'BATCH_ACTION'
          : actionType === 'sidebar panel'
          ? 'SIDEBAR_PANEL'
          : 'SINGLE_SHARE_VIEW'
    })

    downloads.forEach((download) => {
      const { name } = path.parse(download.suggestedFilename())
      downloadedResources.push(name)
    })

    if (actionType === 'sidebar panel') {
      expect(downloads.length).toBe(files.length)
      for (const resource of files) {
        const fileOrFolderName = path.parse(resource.name).name
        if (resource.type === 'file') {
          expect(downloadedResources).toContain(fileOrFolderName)
        } else {
          expect(downloadedResources).toContain('download')
        }
      }
    }
  }

  if (actionType === 'batch action') {
    expect(downloads.length).toBe(1)
    downloads.forEach((download) => {
      const { name } = path.parse(download.suggestedFilename())
      expect(name).toBe('download')
    })
  }
}

When(
  '{string} edits the following resource(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })

    for (const info of stepTable.hashes()) {
      await resourceObject.editResource({ name: info.resource, content: info.content })
    }
  }
)

When(
  '{string} clicks the tag {string} on the resource {string}',
  async function (
    this: World,
    stepUser: string,
    tagName: string,
    resourceName: string
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await resourceObject.clickTag({ resource: resourceName, tag: tagName.toLowerCase() })
  }
)

When(
  /^"([^"].*)" opens the following file(?:s)? in (mediaviewer|pdfviewer|texteditor)$/,
  async function (this: World, stepUser: string, actionType: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })

    for (const info of stepTable.hashes()) {
      await resourceObject.openFileInViewer({
        name: info.resource,
        actionType: actionType as 'mediaviewer' | 'pdfviewer' | 'texteditor'
      })
    }
  }
)

Then(
  'the following resource(s) should contain the following tag(s) in the files list for user {string}',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    for (const { resource, tags } of stepTable.hashes()) {
      const isVisible = await resourceObject.areTagsVisibleForResourceInFilesTable({
        resource,
        tags: tags.split(',').map((tag) => tag.trim().toLowerCase())
      })
      expect(isVisible).toBe(true)
    }
  }
)

Then(
  'the following resource(s) should contain the following tag(s) in the details panel for user {string}',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    for (const { resource, tags } of stepTable.hashes()) {
      const isVisible = await resourceObject.areTagsVisibleForResourceInDetailsPanel({
        resource,
        tags: tags.split(',').map((tag) => tag.trim().toLowerCase())
      })
      expect(isVisible).toBe(true)
    }
  }
)

When(
  '{string} adds the following tag(s) for the following resource(s) using the sidebar panel',
  async function (this: World, stepUser: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    for (const { resource, tags } of stepTable.hashes()) {
      await resourceObject.addTags({
        resource,
        tags: tags.split(',').map((tag) => tag.trim().toLowerCase())
      })
    }
  }
)

When(
  '{string} removes the following tag(s) for the following resource(s) using the sidebar panel',
  async function (this: World, stepUser: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    for (const { resource, tags } of stepTable.hashes()) {
      await resourceObject.removeTags({
        resource,
        tags: tags.split(',').map((tag) => tag.trim().toLowerCase())
      })
    }
  }
)

When(
  '{string} creates space {string} from folder {string} using the context menu',
  async function (this: World, stepUser: string, spaceName: string, folderName: string) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    const space = await resourceObject.createSpaceFromFolder({
      folderName: folderName,
      spaceName: spaceName
    })
    this.spacesEnvironment.createSpace({
      key: space.name,
      space: { name: space.name, id: space.id }
    })
  }
)

When(
  '{string} creates space {string} from resources using the context menu',
  async function (this: World, stepUser: string, spaceName: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    const resources = stepTable.hashes().map((item) => item.resource)
    const space = await resourceObject.createSpaceFromSelection({ resources, spaceName })
    this.spacesEnvironment.createSpace({
      key: space.name,
      space: { name: space.name, id: space.id }
    })
  }
)

Then(
  '{string} should not see the version of the file(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    const fileInfo = stepTable.hashes().reduce((acc, stepRow) => {
      const { to, resource } = stepRow

      if (!acc[to]) {
        acc[to] = []
      }

      acc[to].push(this.filesEnvironment.getFile({ name: resource }))

      return acc
    }, {})

    for (const folder of Object.keys(fileInfo)) {
      await resourceObject.checkThatFileVersionIsNotAvailable({ folder, files: fileInfo[folder] })
    }
  }
)

When(
  '{string} navigates to page {string} of the personal/project space files view',
  async function (this: World, stepUser: string, pageNumber: string) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await resourceObject.changePage({ pageNumber })
  }
)

When(
  '{string} changes the items per page to {string}',
  async function (this: World, stepUser: string, itemsPerPage: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await resourceObject.changeItemsPerPage({ itemsPerPage })
  }
)

Then(
  '{string} should see the text {string} at the footer of the page',
  async function (this: World, stepUser: string, expectedText: string) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    const actualText = await resourceObject.getFileListFooterText()
    expect(actualText).toBe(expectedText)
  }
)

Then(
  '{string} should see {int} resources in the personal/project space files view',
  async function (this: World, stepUser: string, expectedNumberOfResources: number) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    const actualNumberOfResources = await resourceObject.countNumberOfResourcesInThePage()
    expect(actualNumberOfResources).toBe(expectedNumberOfResources)
  }
)

Then(
  '{string} should not see the pagination in the personal/project space files view',
  async function (this: World, stepUser: string) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    await resourceObject.expectPageNumberNotToBeVisible()
  }
)

When(
  '{string} uploads the following resource(s) via drag-n-drop',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })
    const resources = stepTable
      .hashes()
      .map((item) => this.filesEnvironment.getFile({ name: item.resource }))
    await resourceObject.dropUpload({ resources })
  }
)

When(
  '{string} uploads {int} small files in personal space',
  async function (this: World, stepUser: string, numberOfFiles: number): Promise<void> {
    const files = []
    for (let i = 0; i < numberOfFiles; i++) {
      const file = `file${i}.txt`
      runtimeFs.createFile(file, 'test content')

      files.push(
        this.filesEnvironment.getFile({
          name: path.join(runtimeFs.getTempUploadPath().replace(config.assets, ''), file)
        })
      )
    }

    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const resourceObject = new objects.applicationFiles.Resource({ page })

    await resourceObject.uploadLargeNumberOfResources({ resources: files })
  }
)
