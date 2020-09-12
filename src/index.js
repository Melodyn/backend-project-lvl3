import debug from 'debug';
import Listr from 'listr';
import {
  buildPath,
  createFile,
  createDir,
  getDomain,
  urlToName,
  loadContent,
  getResourcesLinks,
  checkDirectory,
} from './utils.js';

const log = debug('page-loader');
Listr.prototype.addTask = function addTask(title, fn) {
  return this.add({
    title,
    task: (ctx) => Promise.resolve(fn(ctx.result)).then((result) => {
      ctx.result = result;
    }),
  });
};

const pageLoader = (url, outputDirPath, progressBar) => new Listr([], { renderer: progressBar })
  .addTask('Check output directory',
    () => {
      log('Input data', { url: url.toString(), outputDirPath });
      return checkDirectory(outputDirPath);
    })
  .addTask(`Load page ${url.toString()}`, () => loadContent(url.toString()))
  .addTask('Load page resources',
    (page) => {
      const resourcesLinks = getResourcesLinks(page.data, getDomain(url));
      log('Page resources', { count: resourcesLinks.length, domain: getDomain(url) });
      const promises = resourcesLinks.map((link) => loadContent(link));
      return Promise.all(promises).then((resources) => ({ page, resources }));
    })
  .addTask('Prepare to save files',
    ({ page, resources }) => {
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
  .addTask('Replace links to paths',
    ({ page, resources, resourcesDirName }) => {
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
  .addTask('Create resources directory',
    ({ resourcesDirName, ...rest }) => {
      log('Create resources directory', { outputDirPath, resourcesDirName });
      return createDir(outputDirPath, resourcesDirName)
        .then((resourcesDirPath) => ({ ...rest, resourcesDirPath }));
    })
  .addTask(`Save page and resources to "${outputDirPath}"`,
    ({ page, resources, resourcesDirPath }) => {
      log('Save page', { outputDirPath, filename: page.filename });
      log(`Save ${resources.length} resources`, { resourcesDirPath });
      const pagePromise = createFile(outputDirPath, page.filename, page.data);
      const resourcePromises = resources
        .map(({ filename, data }) => createFile(resourcesDirPath, filename, data));

      return Promise.all([pagePromise, ...resourcePromises]);
    })
  .run();

export default pageLoader;
