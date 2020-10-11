import path from 'path';
import { promises as fsp } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import 'axios-debug-log';

// urls

const processName = (name, replacer = '-') => name.match(/\w*/gi)
  .filter((x) => x)
  .join(replacer);

export const urlToFilename = (link, defaultFormat = '.html') => {
  const { dir, name, ext } = path.parse(link);
  const slug = processName(path.join(dir, name));
  const format = ext || defaultFormat;

  return `${slug}${format}`;
};

export const urlToDirname = (link, postfix = '_files') => {
  const { dir, name, ext } = path.parse(link);
  const slug = processName(path.join(dir, name, ext));

  return `${slug}${postfix}`;
};

// pages

export const loadContent = (link) => axios.get(link, { responseType: 'arraybuffer' })
  .then(({ data }) => data);

export const processAssets = (html, assetsDirname, origin) => {
  const $ = cheerio.load(html, { decodeEntities: false });
  const tagAttrNameMap = {
    link: 'href',
    script: 'src',
    img: 'src',
  };

  const assetsPaths = Object.entries(tagAttrNameMap)
    .flatMap(([tagName, attrName]) => {
      const localAssets = $(`${tagName}[${attrName}]`).toArray().filter((element) => {
        const url = new URL($(element).attr(attrName), origin);
        return url.origin === origin;
      });

      return localAssets.map((element) => {
        const urlPath = $(element).attr(attrName);
        const url = new URL(urlPath, origin);
        const relativePath = path.join(
          assetsDirname,
          urlToFilename(`${url.hostname}${url.pathname}`),
        );
        $(element).attr(attrName, relativePath);

        return {
          relativePath,
          link: url.toString(),
        };
      });
    });

  return { page: $.html(), assetsPaths };
};

// files

export const buildPath = path.join;

export const createFile = (filepath, content) => fsp
  .writeFile(filepath, content, { encoding: 'utf-8' });

export const createDir = (dirpath) => fsp.mkdir(dirpath);
