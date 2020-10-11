import debug from 'debug';
import Listr from 'listr';
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

const pageLoader = (url, outputDirPath, progressBar) => {
  const pageLink = `${url.hostname}${url.pathname}`;
  const pageFilepath = buildPath(outputDirPath, urlToFilename(pageLink));
  const assetsDirname = urlToDirname(pageLink);
  const assetsDirpath = buildPath(outputDirPath, assetsDirname);
  log('Input data', { url: url.toString(), pageFilepath });

  return loadContent(url.toString())
    .then((page) => {
      log('Create assets directory', { assetsDirpath });
      return createDir(assetsDirpath).then(() => page);
    })
    .then((page) => {
      log('Process assets links', { assetsDirname, origin: url.origin });
      return processAssets(page, assetsDirname, url.origin);
    })
    .then(({ page, assetsPaths }) => {
      log('Save page with processed links', { pageFilepath });
      return createFile(pageFilepath, page).then(() => assetsPaths);
    })
    .then((assetsPaths) => {
      log('Load page assets', { count: assetsPaths.length });
      const promises = assetsPaths.map(({ link, relativePath }) => {
        const filepath = buildPath(outputDirPath, relativePath);
        log('Download asset', { link, filepath });
        return {
          title: link,
          task: () => loadContent(link).then((data) => createFile(filepath, data)),
        };
      });
      const listr = new Listr(promises, { concurrent: true, renderer: progressBar });
      return listr.run();
    })
    .then(() => ({ filename: pageFilepath }));
};

export default pageLoader;
