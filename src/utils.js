import path from 'path';
import fs, { promises as fsp } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import 'axios-debug-log';

// pages

export const loadContent = (link) => {
  const generateRequestError = (statusCode) => (
    new Error(`Request to ${link} failed with status code ${statusCode}`)
  );
  return axios.get(link, { responseType: 'arraybuffer' })
    .catch(({ response }) => {
      if (!response) throw new Error(`Resource ${link} did not return a response`);
      throw generateRequestError(response.status);
    })
    .then(({ data, status }) => {
      if (status !== 200) throw generateRequestError(status);
      return { link, data };
    });
};

export const getResourcesLinks = (html, domain) => {
  const tagAttrNameMap = {
    link: 'href',
    script: 'src',
    img: 'src',
  };

  const $ = cheerio.load(html);

  return Object.entries(tagAttrNameMap)
    .flatMap(([tagName, attrName]) => $(`${tagName}[${attrName}*="${domain}"]`)
      .map((index, element) => $(element).attr(attrName))
      .get());
};

// urls

export const urlToFilename = (name, replacer = '-') => name.match(/\w*/gi)
  .filter((x) => x)
  .join(replacer);

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
  const { dir, name, ext } = path.parse(link);
  const filename = urlToFilename(path.join(dir, name));
  const type = ext.slice(1) || defaultType;
  return { filename, type };
};

// files

export const buildPath = path.join;

export const fileExists = (filepath) => {
  const dirname = path.dirname(filepath);
  const filename = path.basename(filepath);
  return fsp.readdir(dirname)
    .then((filenames) => filenames.includes(filename));
};

export const readFile = (dirpath, filename) => fsp.readFile(path.join(dirpath, filename), 'utf-8');

export const createFile = (dirpath, filename, content) => fsp
  .writeFile(path.resolve(dirpath, filename), content, { encoding: 'utf-8' });

export const createDir = (...paths) => {
  const dirpath = path.join(...paths);
  return fsp.mkdir(dirpath).then(() => dirpath);
};

export const checkWriteAccess = (dirpath) => fsp.stat(dirpath)
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
