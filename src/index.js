import axios from 'axios';
import cheerio from 'cheerio';
import { urlToName, createFile, getDomain } from './utils.js';

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
  const link = url.toString();
  return loadContent(link)
    .then((html) => loadResources(html, domain)
      .then((resources) => ({ html, resources })))
    .then(({ html }) => {
      const { hostname, pathname } = new URL(link);
      const { filename: mainName } = urlToName(hostname + pathname);
      const htmlFilename = `${mainName}.html`;
      // const resourcesDirname = `${mainName}_files`;

      return createFile(outputDirPath, htmlFilename, html);
    });
};

export default pageLoader;
