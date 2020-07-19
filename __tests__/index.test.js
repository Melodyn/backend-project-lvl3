import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import nock from 'nock';
import pageLoader from '../index.js';
import * as pathToolkit from '../src/pathToolkit.js';

const url = new URL('https://hexlet.io/courses');
const domain = pathToolkit.getDomain(url);
const expectedContent = 'Hello from hexlet.io courses!';
const expectedFilename = 'hexlet-io-courses.html';

let tmpDirPath = '';
const fileExists = (dirpath, filename) => fs.readdir(dirpath)
  .then((filenames) => filenames.includes(filename));
const readFile = (dirpath, filename) => fs.readFile(path.join(dirpath, filename), 'utf-8');

beforeAll(async () => {
  tmpDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('tmp dir', async () => {
  const fileAlreadyExist = await fileExists(tmpDirPath, expectedFilename);
  expect(fileAlreadyExist).toBe(false);

  nock(new RegExp(domain)).get(/.*/).reply(200, expectedContent);
  await pageLoader(url, tmpDirPath);

  const fileWasCreated = await fileExists(tmpDirPath, expectedFilename);
  expect(fileWasCreated).toBe(true);

  const actualContent = await readFile(tmpDirPath, expectedFilename);
  expect(actualContent).toBe(expectedContent);
});
