import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import nock from 'nock';
import pageLoader from '../index.js';
import * as utils from '../src/utils.js';

const buildFixturesPath = (...paths) => path.join('__fixtures__', ...paths);

let tmpDirPath = '';
let expectedPageContent = '';
let resources = [
  {
    format: 'css',
    urlPath: '/assets/application-8c09cda7aec4e387f473cc08d778b2a7f8a1e9bfe968af0633e6ab8c2f38e03f.css',
    filename: path.join(
      'hexlet-io-courses_files',
      'assets-application-8c09cda7aec4e387f473cc08d778b2a7f8a1e9bfe968af0633e6ab8c2f38e03f.css',
    ),
  },
  {
    format: 'svg',
    urlPath: '/assets/professions/frontend-be958f979985faf47f82afea21e2d4f2ffb22b467f1c245d926dcb765b9ed953.svg',
    filename: path.join(
      'hexlet-io-courses_files',
      'assets-professions-frontend-be958f979985faf47f82afea21e2d4f2ffb22b467f1c245d926dcb765b9ed953.svg',
    ),
  },
  {
    format: 'js',
    urlPath: '/packs/js/runtime-64630796b8e08f0f1f1d.js',
    filename: path.join(
      'hexlet-io-courses_files',
      'packs-js-runtime-64630796b8e08f0f1f1d.js',
    ),
  },
];

const pageFilename = 'hexlet-io-courses.html';
const baseUrl = 'https://hexlet.io';
const pagePath = '/courses';
const pageUrl = new URL(pagePath, baseUrl);
const domain = utils.getDomain(pageUrl);
const formats = resources.map(({ format }) => [format]);
const scope = nock(new RegExp(`.*${domain}`)).persist();

nock.disableNetConnect();

beforeAll(async () => {
  tmpDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  const sourcePageContent = await utils.readFile(buildFixturesPath(), pageFilename);
  const promises = resources.map((info) => utils
    .readFile(buildFixturesPath('expected'), info.filename)
    .then((data) => ({ ...info, data })));

  expectedPageContent = await utils.readFile(buildFixturesPath('expected'), pageFilename);
  resources = await Promise.all(promises);

  scope.get(pagePath).reply(200, sourcePageContent);
  resources.forEach(({ urlPath, data }) => scope.get(urlPath).reply(200, data));
});

describe('negative cases', () => {
  test('load page', async () => {
    const fileAlreadyExist = await utils.fileExists(path.join(tmpDirPath, pageFilename));
    expect(fileAlreadyExist).toBe(false);

    await expect(pageLoader(baseUrl, tmpDirPath)).rejects.toThrow();

    const fileWasCreated = await utils.fileExists(path.join(tmpDirPath, pageFilename));
    expect(fileWasCreated).toBe(false);
  });
});

describe('positive cases', () => {
  test('load page', async () => {
    const fileAlreadyExist = await utils.fileExists(path.join(tmpDirPath, pageFilename));
    expect(fileAlreadyExist).toBe(false);

    await pageLoader(pageUrl.toString(), tmpDirPath);

    const fileWasCreated = await utils.fileExists(path.join(tmpDirPath, pageFilename));
    expect(fileWasCreated).toBe(true);

    const actualContent = await utils.readFile(tmpDirPath, pageFilename);
    expect(actualContent).toBe(expectedPageContent);
  });

  test.each(formats)('check .%s-resource', async (format) => {
    const { filename, data } = resources.find((content) => content.format === format);

    const fileWasCreated = await utils.fileExists(path.join(tmpDirPath, filename));
    expect(fileWasCreated).toBe(true);

    const actualContent = await utils.readFile(tmpDirPath, filename);
    expect(actualContent).toBe(data);
  });
});
