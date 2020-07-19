import fs from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import axios from 'axios';

const l = console.log;

const getDomain = (hostname) => {
  const iter = (symbolCount, domain) => {
    if (symbolCount < 0) return domain;
    const currentSymbol = hostname[symbolCount];
    return (currentSymbol === '.' && domain.includes(currentSymbol))
      ? domain
      : iter(symbolCount - 1, currentSymbol + domain);
  };
  return iter(hostname.length - 1, '');
};
const urlPathToName = (urlPath) => {
  const { dir, name, ext } = path.parse(urlPath);
  const processedName = path.join(dir, name).match(/\w*/gi)
    .filter((x) => x)
    .join('-');
  return processedName + ext;
};
const urlToName = (url, postfix = '') => {
  const { hostname, pathname } = new URL(url);
  const name = urlPathToName(`${hostname}${pathname}`);
  return name + postfix;
};

const html = fs.readFileSync('./__fixtures__/hexlet-io-courses.html');
const $ = cheerio.load(html);
const map = {
  link: 'href',
  script: 'src',
  img: 'src',
};
const domain = getDomain('hexlet.io');

const list = Object.entries(map)
  .flatMap(([tagName, attrName]) => $(`${tagName}[${attrName}*="${domain}"]`)
    .map((i, e) => $(e).attr(attrName))
    .get());

l(list);
