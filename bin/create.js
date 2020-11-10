#!/usr/bin/env node
'use strict';

const fs = require('fs');
const cp = require('child_process');
const path = require('path');
installScriptDeps();

/**
 * @typedef {Object} ProjectParams
 * @property {string} name The name of a project.
 * @property {string} prefix Prefix for Angular components.
 * @property {string} template Template SSH URL.
 */

/** @type {Partial<ProjectParams>} */
const DEFAULT_ARGUMENTS = {
  template: 'git@gitlab.saritasa.com:saritasa/js/angular-template.git',
};

// Args
const { name, prefix, template: templateSshUrl } = askForProjectParams(
  DEFAULT_ARGUMENTS,
);

// Constants
const CURRENT_DIR = process.cwd();
const PROJECT_DIR = path.join(CURRENT_DIR, name);

try {
  fetchTemplate(PROJECT_DIR, templateSshUrl);
  checkTemplateValidity(PROJECT_DIR);
  replaceBoilerplateCode(name, prefix);
  configureTsLint(PROJECT_DIR);
  installProjectDeps();
  prepareGit(PROJECT_DIR);
} catch (error) {
  console.error(error);
  process.exit(1);
}

/**
 * Install npm dependencies.
 */
function installScriptDeps() {
  console.log(`cd ${__dirname} && npm ci && cd ${process.cwd()}`);
  cp.execSync(`cd ${__dirname} && npm ci && cd ${process.cwd()}`);
}

/**
 * Ask user for project params
 * @param {typeof DEFAULT_ARGUMENTS} defaultOptions
 * @returns {ProjectParams} // TODO declare return type
 */
function askForProjectParams(defaultOptions) {
  const providedOptions = require('commander')
    .storeOptionsAsProperties(false)
    .version('0.1.0')
    .requiredOption('-n, --name <name>', 'Name of the project')
    .requiredOption('-p, --prefix <prefix>', "Prefix for Angular's components")
    .option('--no-linter', "Don't configure linter")
    .option(
      '-t, --template <repository_url>',
      'Custom repository url',
      defaultOptions.template,
    )
    .parse()
    .opts();

  // Since we know that the `commander` would check provided options
  // @ts-ignore
  return {
    ...defaultOptions,
    ...providedOptions,
  };
}

/**
 * Clone project template from a repository.
 * @param {string} directory Name of the folder to fetch the template in.
 * @param {string} templateSshUrl SSH URL of an Angular template.
 * @param {boolean} verbose Whether the message should be displayed.
 * @throws {Error} Error message if the dirrectory already exists.
 */
function fetchTemplate(directory, templateSshUrl, verbose = false) {
  if (fs.existsSync(directory)) {
    throw new Error(`${directory} already exists.`);
  }

  if (verbose) {
    console.log('Fetching the template...');
  }

  cp.execSync(`git clone ${templateSshUrl} ${directory} -q`);
}

/**
 * Check whether the fetched template is valid.
 * @param {string} directory Project dir.
 * @throws {Error} If template is invalid.
 */
function checkTemplateValidity(directory) {
  // Check whether the boilerplate is angular project by looking for `angular.json`.
  if (!fs.existsSync(path.join(directory, 'angular.json'))) {
    // Clean up and throw
    // TODO (Chernodub): `rmdirSync` is experimental, replace with `rimraf` package if there's problems
    fs.rmdirSync(directory, { recursive: true });

    throw new Error('Template is not an Angular project.');
  }
}

/**
 * Resolve additional tools.
 * @param {string} directory Project dir.
 * @param {boolean} verbose Whether the message should be displayed.
 */
function configureTsLint(directory, verbose = false) {
  if (verbose) {
    console.log('Preparing linting tools...');
  }

  const lintConfigPath = path.join(directory, 'tslint.json');
  const modifiedLintConfig = {
    extends: '@saritasa/tslint-config-angular',
    ...JSON.parse(fs.readFileSync(lintConfigPath).toString()),
  };
  cp.execSync(`cd ${directory} && npm i @saritasa/tslint-config-angular`);
  fs.writeFileSync(lintConfigPath, JSON.stringify(modifiedLintConfig));
}

/**
 * Replace all the boilerplate code according to provided arguments.
 * @param {string} name Name of the project.
 * @param {string} prefix Angular components prefix.
 * @param {boolean} verbose Whether the message should be displayed.
 */
function replaceBoilerplateCode(name, prefix, verbose = false) {
  // @ts-ignore replace-in-files typing
  const replaceInFiles = require('replace-in-files');

  if (verbose) {
    console.log('Preparing the boilerplate for you...');
  }
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
      to: prefix,
      ignore: ['**/node_modules/**'],
    }),
  );
}

/**
 * Prepare git repository.
 * @param {string} dir Project directory.
 * @param {string} commitMessage Message for initial commit.
 */
function prepareGit(dir, commitMessage = 'initial commit') {
  cp.execSync(
    `cd ${dir} && rm -rf .git && git init && git add . && git commit -m "${commitMessage}"`,
  );
}

/**
 * Install latest dependencies for the project.
 * @param {boolean} verbose Whether the message should be displayed.
 */
function installProjectDeps(verbose = false) {
  if (verbose) {
    console.log('Installing latest dependencies...');
  }
  cp.execSync(`cd ${PROJECT_DIR} && npm i && npx ng update && npm update`);
}
