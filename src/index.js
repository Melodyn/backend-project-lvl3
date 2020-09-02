import axios from 'axios';
import path from 'path';
import cheerio from 'cheerio';
import {
  urlToName, createFile, createDir, getDomain,
} from './utils.js';

const tagAttrNameMap = {
  link: 'href',
  script: 'src',
  img: 'src',
};

const contentTypeMap = {
  page: 'page',
  resource: 'resource',
};

const loadContent = (link, type) => axios
  .get(link, { responseType: 'arraybuffer' })
  .then(({ data }) => ({ type, link, data }));

const getResourcesLinks = (html, domain) => {
  const $ = cheerio.load(html);

  return Object.entries(tagAttrNameMap)
    .flatMap(([tagName, attrName]) => $(`${tagName}[${attrName}*="${domain}"]`)
      .map((index, element) => $(element).attr(attrName))
      .get());
};

const pageLoader = (url, outputDirPath) => {
  const domain = getDomain(url);
  const mainLink = url.toString();

  return loadContent(mainLink, contentTypeMap.page)
    .then((page) => {
      const resourcesLinks = getResourcesLinks(page.data, domain);
      const promises = resourcesLinks.map((link) => loadContent(link, contentTypeMap.resource));
      return Promise.all(promises).then((resources) => [page, ...resources]);
    })
    .then((pages) => {
      const { link: pageLink } = pages.find(({ type }) => type === contentTypeMap.page);
      const { hostname, pathname } = new URL(pageLink);
      const { filename, type: ext } = urlToName(hostname + pathname);
      const resourcesDirName = `${filename}_files`;

      return pages.flatMap(({ type, link, data }) => {
        switch (type) {
          case contentTypeMap.page:
            return {
              type,
              link,
              dirname: '',
              filename: `${filename}.${ext}`,
              data,
            };
          case contentTypeMap.resource: {
            const { pathname: linkPath } = new URL(link);
            const { filename: name, type: extension } = urlToName(linkPath);

            return {
              type,
              link,
              dirname: resourcesDirName,
              filename: `${name}.${extension}`,
              data,
            };
          }
          default:
            throw new Error(`Unknown type ${type}`);
        }
      });
    })
    .then((pages) => {
      const [{ data, ...rest }, ...resources] = pages;
      const updatedData = resources.reduce(
        (html, { link, dirname, filename }) => html.replace(link, path.join(dirname, filename)),
        data.toString(),
      );
      return [{ data: updatedData, ...rest }, ...resources];
    })
    .then((pages) => {
      const { dirname: resourcesDirname } = pages
        .find(({ type }) => type === contentTypeMap.resource);
      return createDir(outputDirPath, resourcesDirname)
        .then((outDirPath) => pages.map(({ type, filename, data }) => {
          switch (type) {
            case contentTypeMap.page:
              return createFile(outputDirPath, filename, data);
            case contentTypeMap.resource:
              return createFile(outDirPath, filename, data);
            default:
              throw new Error(`Unknown type ${type}`);
          }
        }))
        .then((promises) => Promise.all(promises));
    });
};

export default pageLoader;
