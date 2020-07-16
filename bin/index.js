#!/usr/bin/env node

import program from 'commander';
import pageLoader from '../index.js';

program.version('1.0.0')
  .option('--output [path]', 'output path', process.cwd())
  .arguments('<link>')
  .action(async (link) => {
    await pageLoader(link, program.output);
  })
  .parse(process.argv);
