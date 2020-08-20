import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import nock from 'nock';
import pageLoader from '../index.js';
import * as utils from '../src/utils.js';

const baseUrl = 'https://hexlet.io';

let contents = [
  {
    format: 'html',
    urlPath: '/courses',
    filename: 'hexlet-io-courses.html',
  },
  // {
  //   format: 'css',
  //   urlPath: '/assets/application-8c09cda7aec4e387f473cc08d778b2a7f8a1e9bfe968af0633e6ab8c2f38e03f.css',
  //   filename: path.join(
  //     'hexlet-io-courses_files',
  //     'assets-application-8c09cda7aec4e387f473cc08d778b2a7f8a1e9bfe968af0633e6ab8c2f38e03f.css',
  //   ),
  // },
  // {
  //   format: 'svg',
  //   urlPath: '/assets/professions/frontend-be958f979985faf47f82afea21e2d4f2ffb22b467f1c245d926dcb765b9ed953.svg',
  //   filename: path.join(
  //     'hexlet-io-courses_files',
  //     'assets-professions-frontend-be958f979985faf47f82afea21e2d4f2ffb22b467f1c245d926dcb765b9ed953.svg',
  //   ),
  // },
  // {
  //   format: 'js',
  //   urlPath: '/packs/js/runtime-64630796b8e08f0f1f1d.js',
  //   filename: path.join(
  //     'hexlet-io-courses_files',
  //     'packs-js-runtime-64630796b8e08f0f1f1d.js',
  //   ),
  // },
];
const formats = contents.map(({ format }) => format);

let tmpDirPath = '';

nock.disableNetConnect();

beforeAll(async () => {
  tmpDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  const promises = contents.map((content) => utils
    .readFile('__fixtures__', content.filename)
    .then((data) => ({ ...content, data })));
  contents = await Promise.all(promises);

  contents.forEach(({ urlPath, data }) => nock(baseUrl).get(urlPath).reply(200, data));
});

test.each(formats)('download %s', async (format) => {
  const { urlPath, filename, data } = contents.find((content) => content.format === format);
  const url = new URL(urlPath, baseUrl);

  const fileAlreadyExist = await utils.fileExists(tmpDirPath, filename);
  expect(fileAlreadyExist).toBe(false);

  await pageLoader(url.toString(), tmpDirPath);
  const fileWasCreated = await utils.fileExists(tmpDirPath, filename);
  expect(fileWasCreated).toBe(true);

  const actualContent = await utils.readFile(tmpDirPath, filename);
  expect(actualContent).toBe(data);
});
