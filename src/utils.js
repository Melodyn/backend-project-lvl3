import path from 'path';
import fs, { promises as fsp } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import 'axios-debug-log';

// pages

export const loadContent = (link) => axios.get(link, { responseType: 'arraybuffer' })
  .catch(({ response }) => {
    if (!response) {
      throw new Error(`Resource ${link} did not return a response`);
    }
    throw new Error(`Request to ${link} failed with status code ${response.status}`);
  })
  .then(({ data, status }) => {
    if (status !== 200) {
      throw new Error(`Request to ${link} failed with status code ${status}`);
    }
    return { link, data };
  });

export const getResourcesLinks = (html, domain) => {
  const $ = cheerio.load(html);
  const tagAttrNameMap = {
    link: 'href',
    script: 'src',
    img: 'src',
  };

  return Object.entries(tagAttrNameMap)
    .flatMap(([tagName, attrName]) => $(`${tagName}[${attrName}*="${domain}"]`)
      .map((index, element) => $(element).attr(attrName))
      .get());
};

// urls

export const getDomain = ({ hostname }) => {
  const iter = (symbolCount, domainAcc) => {
    if (symbolCount < 0) return domainAcc;
    const currentSymbol = hostname[symbolCount];
    const isSubDomain = ((currentSymbol === '.') && domainAcc.includes(currentSymbol));
    return isSubDomain
      ? domainAcc
      : iter(symbolCount - 1, currentSymbol + domainAcc);
  };
  return iter(hostname.length - 1, '');
};

export const urlToName = (link, defaultType = 'html') => {
  const urlToFilename = (name, replacer = '-') => name.match(/\w*/gi)
    .filter((x) => x)
    .join(replacer);

  const { dir, name, ext } = path.parse(link);
  const filename = urlToFilename(path.join(dir, name));
  const type = ext.slice(1) || defaultType;
  return { filename, type };
};

// files

export const buildPath = path.join;

export const createFile = (filepath, content) => fsp
  .writeFile(filepath, content, { encoding: 'utf-8' });

export const createDir = (dirpath) => fsp.mkdir(dirpath).then(() => dirpath);

export const checkDirectory = (dirpath) => fsp.stat(dirpath)
  .catch(() => {
    throw new Error(`${dirpath} not exists`);
  })
  .then((stats) => {
    if (!stats.isDirectory()) {
      throw new Error(`${dirpath} is not a directory`);
    }
    return fsp.access(dirpath, fs.constants.W_OK)
      .catch(() => {
        throw new Error(`No access to write in ${dirpath}`);
      });
  });
