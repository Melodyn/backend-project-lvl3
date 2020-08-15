import fs from 'fs';
import cheerio from 'cheerio';
import { getDomain } from './utils.js';

const l = console.log;

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
