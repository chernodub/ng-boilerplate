#!/usr/bin/env node
'use strict';

// Deps
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

// Args
const [boilerplateUrl, name] = process.argv.slice(2);

// Base vars
const rootDir = process.cwd();
console.log('Root: ', rootDir);
const ANGULAR_CONFIG_NAME = 'angular.json';

// Clone boilerplate
if (fs.existsSync(path.join(rootDir, name))) {
  console.error(`Folder ${name} already exists.`);
  process.exit(1);
}
cp.execSync(`git clone ${boilerplateUrl} ${name}`);

// Check whether the boilerplate is angular project by looking for `angular.json`.
if (!fs.existsSync(path.join(rootDir, name, ANGULAR_CONFIG_NAME))) {
  console.log('Boilerplate is not an Angular project.');
  // Clean up and exit
  cp.execSync(`rm -rf ${name}`);
  process.exit(1);
}

// TODO remove
cp.execSync('npm i');
const cowsay = require('cowsay');
console.log(cowsay.say({ text: 'sup' }));
