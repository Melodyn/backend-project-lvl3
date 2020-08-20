import fs from 'fs';
import cheerio from 'cheerio';
import { getDomain } from './utils.js';

const l = console.log;

const html = fs.readFileSync('./__fixtures__/_hexlet-io-courses.html', 'utf-8');
const $ = cheerio.load(html);
const map = {
  link: 'href',
  script: 'src',
  img: 'src',
};
const domain = getDomain(new URL('https://hexlet.io'));

const list = Object.entries(map)
  .flatMap(([tagName, attrName]) => $(`${tagName}[${attrName}*="${domain}"]`)
    .map((i, e) => $(e).attr(attrName))
    .get());

l(list);
