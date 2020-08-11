import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import nock from 'nock';
import pageLoader from '../index.js';
import * as pathToolkit from '../src/pathToolkit.js';

const baseUrl = 'https://hexlet.io';
const urlPath = '/courses';
const url = new URL(urlPath, baseUrl);
const domain = pathToolkit.getDomain(url);
const expectedContent = 'Hello from hexlet.io courses!';
const expectedFilename = 'hexlet-io-courses.html';

let tmpDirPath = '';
let fixturePaths = [];
const fileExists = (dirpath, filename) => fs.readdir(dirpath)
  .then((filenames) => filenames.includes(filename));
const readFile = (dirpath, filename) => fs.readFile(path.join(dirpath, filename), 'utf-8');
const getFixturePaths = (currentDirPath) => fs.readdir(currentDirPath, { withFileTypes: true })
  .then((children) => children
    .flatMap((child) => (child.isDirectory()
      ? getFixturePaths(path.join(currentDirPath, child.name))
      : Promise.resolve({ dirname: currentDirPath, filename: child.name }))))
  .then((paths) => Promise.all(paths).then((arr) => arr.flat()))
  .then((paths) => console.log(paths));
  // .then((paths) => paths.map(({ dirname, filename }) => readFile(dirname, filename)));

nock.disableNetConnect();

beforeAll(async () => {
  tmpDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  fixturePaths = await getFixturePaths('__fixtures__');
});

test('tmp dir', async () => {
  // console.log(fixturePaths[0]);
  const fileAlreadyExist = await fileExists(tmpDirPath, expectedFilename);
  expect(fileAlreadyExist).toBe(false);

  const scope = nock(new RegExp(domain)).get(/.*/)
    .reply(200, () =>
      // console.log('path:', this.req.path);
      expectedContent);
    // .reply(200, expectedContent);
  await pageLoader(url, tmpDirPath);
  expect(scope.isDone()).toBe(true);

  const fileWasCreated = await fileExists(tmpDirPath, expectedFilename);
  expect(fileWasCreated).toBe(true);

  const actualContent = await readFile(tmpDirPath, expectedFilename);
  expect(actualContent).toBe(expectedContent);
});
