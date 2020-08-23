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

const loadContent = (link) => axios
  .get(link, { responseType: 'arraybuffer' })
  .then(({ data }) => data);

const loadResources = (html, domain) => {
  const $ = cheerio.load(html);
  const links = Object.entries(tagAttrNameMap)
    .flatMap(([tagName, attrName]) => $(`${tagName}[${attrName}*="${domain}"]`)
      .map((index, element) => $(element).attr(attrName))
      .get());

  const promises = links.map((link) => loadContent(link)
    .then((data) => ({ link, data })));

  return Promise.all(promises);
};

const pageLoader = (url, outputDirPath) => {
  const domain = getDomain(url);
  const mainLink = url.toString();

  return loadContent(mainLink)
    .then((html) => loadResources(html, domain)
      .then((resources) => ({ html, resources })))
    .then(({ html, resources }) => {
      const { hostname, pathname } = new URL(mainLink);
      const { filename: mainName } = urlToName(hostname + pathname);
      const htmlFilename = `${mainName}.html`;
      const resourcesDirname = `${mainName}_files`;

      return createDir(outputDirPath, resourcesDirname)
        .then((outDirPath) => {
          const promises = resources.map(({ link, data }) => {
            const { filename: name, type } = urlToName(new URL(link).pathname);
            const filename = `${name}.${type}`;
            return createFile(outDirPath, filename, data);
          });
          return Promise.all(promises);
        })
        .then(() => {
          const $ = cheerio.load(html);
          Object.entries(tagAttrNameMap)
            .flatMap(([tagName, attrName]) => $(`${tagName}[${attrName}*="${domain}"]`)
              .map((index, element) => {
                const link = $(element).attr(attrName);
                const { filename: name, type } = urlToName(new URL(link).pathname);
                const filename = `${name}.${type}`;
                const filepath = path.join(resourcesDirname, filename);
                return $(element).attr(attrName, filepath);
              }));
          return $.html();
        })
        .then((updatedHTML) => createFile(outputDirPath, htmlFilename, updatedHTML));
    });
};

export default pageLoader;
