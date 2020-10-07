#!/usr/bin/env node
'use strict';

// Native deps
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

// Args
// const [boilerplateUrl, name] = process.argv.slice(2);
const [boilerplateUrl, name, prefix] = [
  'https://github.com/chernodub/ng-template',
  'test',
  'test',
];

// Base vars
const projectDir = path.join(process.cwd(), name);
const ANGULAR_CONFIG_NAME = 'angular.json';

// Install additional deps
cp.execSync(`cd ${__dirname} && npm i && cd ${process.cwd()}`);

// Deps
const replaceInFiles = require('replace-in-files');

// Clone boilerplate
console.log(name);
if (fs.existsSync(projectDir)) {
  console.error(`Folder ${name} already exists.`);
  process.exit(1);
}
console.log('Fetching boilerplate...');
cp.execSync(`git clone ${boilerplateUrl} ${name} -q`);

// Check whether the boilerplate is angular project by looking for `angular.json`.
if (!fs.existsSync(path.join(projectDir, ANGULAR_CONFIG_NAME))) {
  console.log('Boilerplate is not an Angular project.');
  // Clean up and exit
  cp.execSync(`rm -rf ${name}`);
  process.exit(1);
}

console.log('Preparing linting tools...');
const lintConfigPath = path.join(projectDir, 'tslint.json');
const modifiedLintConfig = {
  extends: '@saritasa/tslint-config-angular',
  ...JSON.parse(fs.readFileSync(lintConfigPath)),
};
fs.writeFileSync(lintConfigPath, JSON.stringify(modifiedLintConfig));

console.log('Preparing boilerplate for you...');
// Replace app name
replaceInFiles({
  files: [`${name}/*`, `${name}/**/*`],
  from: /APP_NAME/g,
  to: name,
  ignore: ['**/node_modules/**'],
}).then(() =>
  replaceInFiles({
    files: [`${name}/*`, `${name}/**/*`],
    from: /APP_PREFIX/g,
    to: name,
    ignore: ['**/node_modules/**'],
  }),
);

// Replace app prefix

console.log('Trying to get latest deps...');
cp.execSync(`cd ${projectDir} && npm i @saritasa/tslint-config-angular`);
cp.execSync(`cd ${projectDir} && npm i && npx ng update && npm update`);
