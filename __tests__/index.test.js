import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import nock from 'nock';
import pageLoader from '../index.js';
import * as pathToolkit from '../src/utils.js';

const baseUrl = 'https://hexlet.io';
const urlPath = '/courses';
const url = new URL(urlPath, baseUrl);
const expectedFilename = 'hexlet-io-courses.html';

let tmpDirPath = '';
let expectedContent = '';

nock.disableNetConnect();

beforeAll(async () => {
  tmpDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  expectedContent = await pathToolkit.readFile('__fixtures__', expectedFilename);
  nock(baseUrl).get(urlPath).reply(200, expectedContent);
});

test('tmp dir', async () => {
  const fileAlreadyExist = await pathToolkit.fileExists(tmpDirPath, expectedFilename);
  expect(fileAlreadyExist).toBe(false);

  await pageLoader(url.toString(), tmpDirPath);
  const fileWasCreated = await pathToolkit.fileExists(tmpDirPath, expectedFilename);
  expect(fileWasCreated).toBe(true);

  const actualContent = await pathToolkit.readFile(tmpDirPath, expectedFilename);
  expect(actualContent).toBe(expectedContent);
});
