#!/usr/bin/env node

import program from 'commander';
import pageLoader from '../index.js';

program.version('1.0.0')
  .option('-o, --output [path]', 'output path', process.cwd())
  .option('-b, --progress-bar [name]', 'progress bar name: default | silent', 'default')
  .arguments('<link>')
  .action(async (link) => {
    await pageLoader(link, program.output, program.progress)
      .catch((err) => {
        console.error(err.toString());
        process.exit(1);
      });
  })
  .parse(process.argv);
