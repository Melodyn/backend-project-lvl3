import debug from 'debug';
import Listr from 'listr';
import { promises as fs } from 'fs';
import {
  urlToFilename,
  urlToDirname,
  loadContent,
  processAssets,
  buildPath,
  createDir,
  createFile,
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
  .addTask(`Load page ${url.toString()}`,
    () => {
      log('Input data', { url: url.toString(), outputDirPath });
      return loadContent(url.toString());
    })
  .addTask('Prepare filenames and create assets directory',
    (page) => {
      const pageLink = url.hostname + url.pathname;
      const pageFilename = urlToFilename(pageLink);
      const assetsDirname = urlToDirname(url.hostname + url.pathname);
      const assetsDirpath = buildPath(outputDirPath, assetsDirname);
      log('Create assets directory', { assetsDirpath });
      return createDir(assetsDirpath).then(() => ({ page, pageFilename, assetsDirname }));
    })
  .addTask('Process assets links and save page',
    ({ page, pageFilename, assetsDirname }) => {
      log('Process assets links', { assetsDirname, origin: url.origin });
      const {
        page: processedPage,
        assetsPaths,
      } = processAssets(page, assetsDirname, url.origin);
      const pagePath = buildPath(outputDirPath, pageFilename);
      log('Save page', { pagePath });
      return createFile(pagePath, processedPage).then(() => assetsPaths);
    })
  .addTask('Load page assets',
    (assetsPaths) => {
      log('Load page assets', { count: assetsPaths.length });
      const promises = assetsPaths.map(({ link, filepath }) => loadContent(link)
        .then((data) => ({ filepath, data })));
      return Promise.all(promises);
    })
  .addTask('Save assets',
    (assets) => {
      log('Save assets', { count: assets.length });
      const promises = assets.map(({ filepath, data }) => createFile(
        buildPath(outputDirPath, filepath),
        data,
      ));
      return Promise.all(promises);
    })
  .run();

export default pageLoader;
