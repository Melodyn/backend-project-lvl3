import {
  buildPath,
  createFile,
  createDir,
  getDomain,
  urlToName,
  loadContent,
  getResourcesLinks,
} from './utils.js';

const pageLoader = (url, outputDirPath) => loadContent(url.toString())
  .then((page) => {
    const resourcesLinks = getResourcesLinks(page.data, getDomain(url));
    const promises = resourcesLinks.map((link) => loadContent(link));
    return Promise.all(promises).then((resources) => ({ page, resources }));
  })
  .then(({ page, resources }) => {
    const { filename: pageFilename, type: pageType } = urlToName(url.hostname + url.pathname);
    const updatedResources = resources.map(({ link, data }) => {
      const { filename, type } = urlToName(new URL(link).pathname);
      return { link, filename: `${filename}.${type}`, data };
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
  .then(({ page, resources, resourcesDirName }) => createDir(outputDirPath, resourcesDirName)
    .then((resourcesDirPath) => {
      const pagePromise = createFile(outputDirPath, page.filename, page.data);
      const resourcePromises = resources
        .map(({ filename, data }) => createFile(resourcesDirPath, filename, data));

      return Promise.all([pagePromise, ...resourcePromises]);
    }));

export default pageLoader;
