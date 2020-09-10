import debug from 'debug';
import {
  buildPath,
  createFile,
  createDir,
  getDomain,
  urlToName,
  loadContent,
  getResourcesLinks,
  checkWriteAccess,
} from './utils.js';

const log = debug('page-loader');

const pageLoader = (url, outputDirPath) => checkWriteAccess(outputDirPath)
  .then(({ accessIsAllow, errorMessage }) => {
    if (!accessIsAllow) throw new Error(errorMessage);
    log('load page from: ', url.toString());
    return loadContent(url.toString());
  })
  .then((page) => {
    const resourcesLinks = getResourcesLinks(page.data, getDomain(url));
    const promises = resourcesLinks.map((link) => loadContent(link));
    log('load page resources: ', `${promises.length} ones`);
    return Promise.all(promises).then((resources) => ({ page, resources }));
  })
  .then(({ page, resources }) => {
    log('process resources links to filenames');
    const { filename: pageFilename, type: pageType } = urlToName(url.hostname + url.pathname);
    const updatedResources = resources.map(({ link, data }) => {
      const { filename, type } = urlToName(new URL(link).pathname);
      return {
        link,
        filename: `${filename}.${type}`,
        data,
      };
    });

    return {
      page: {
        ...page,
        filename: `${pageFilename}.${pageType}`,
      },
      resources: updatedResources,
      resourcesDirName: `${pageFilename}_files`,
    };
  })
  .then(({ page, resources, resourcesDirName }) => {
    log('replace on page links to filepaths');
    const updatedData = resources.reduce(
      (html, { link, filename }) => html.replace(link, buildPath(resourcesDirName, filename)),
      page.data.toString(),
    );

    return {
      page: {
        ...page,
        data: updatedData,
      },
      resources,
      resourcesDirName,
    };
  })
  .then(({ page, resources, resourcesDirName }) => {
    log('create resources directory: ', `${resourcesDirName} in ${outputDirPath}`);
    return createDir(outputDirPath, resourcesDirName)
      .then((resourcesDirPath) => {
        log(
          'save content: ',
          `${page.filename} to ${outputDirPath}`,
          `${resources.length} resources to ${resourcesDirPath}`,
        );
        const pagePromise = createFile(outputDirPath, page.filename, page.data);
        const resourcePromises = resources
          .map(({ filename, data }) => createFile(resourcesDirPath, filename, data));

        return Promise.all([pagePromise, ...resourcePromises]);
      });
  })
  .then(() => log('Done!'));

export default pageLoader;
