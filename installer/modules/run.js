/**
 * Installation
 */

const user = 'msteinerweb';
const repo = 'wordpressify-theme';
const branch = 'master';

const settings = require('../settings');

const fs = require('fs-extra');
const theCWD = process.cwd();
const theCWDArray = theCWD.split('/');
const theDir = theCWDArray[theCWDArray.length - 1];
const ora = require('ora');
const execa = require('execa');
const chalk = require('chalk');
const download = require('download');
const handleError = require('./handleError.js');
const clearConsole = require('./clearConsole.js');
const printNextSteps = require('./printNextSteps.js');


module.exports = () => {
	// Init.
	clearConsole();


	// Start.
	console.log('\n');
	console.log(
		'📦 ',
		chalk.black.bgYellow(` Downloading 🎈 WordPressify files in: → ${chalk.bgGreen(` ${theDir} `)}\n`),
		chalk.dim(`\n In the directory: ${theCWD}\n`),
		chalk.dim('This might take a couple of minutes.\n'),
	);

	const spinner = ora({ text: '' });

	// get theme files
	spinner.start(`1. Creating 🎈 WordPressify files inside → ${chalk.black.bgWhite(` ${theDir} `)}`);
	download(`https://github.com/${user}/${repo}/archive/${branch}.zip`, theCWD, {extract: true})

		.then(() => {
			if(process.platform === 'win32') return execa('xcopy', [`${theCWD}\\${repo}-${branch}\\*.*`, theCWD, '/E/H']);
			return execa('rsync', ['-avzh', `${theCWD}/${repo}-${branch}/`, `${theCWD}/`]);
		})
		.then(() => fs.remove(`${repo}-${branch}`))


		// download wordpress
		.then(() => {
			spinner.succeed();
			spinner.start(`2. Installing WordPress files from ${chalk.green('https://wordpress.org/')} ...`);
			return fs.mkdir(`${theCWD}/build`)
		})
		.then(() => download('https://www.wordpress.org/latest.zip', `${theCWD}/build`, {extract: true}))


		// install npm
		.then(() => {
			spinner.succeed();
			spinner.start('3. Installing npm packages...');
			return execa('npm', ['install'])
		})

		// install WordPress
		.then(() => {
			spinner.succeed();
			spinner.start('4. Installing WordPress...');
			return execa('wp', ['config', 'create', '--dbname=test', `--dbuser=${settings.wordpress.dbuser}`, `--dbpass=${settings.wordpress.dbpass}`, `--dbhost=${dbhost}`, '--force', `--path=${theCWD}/build/wordpress`]);
		})
		.then(() => execa('wp', ['core', 'install', '--url=http://127.0.0.1:3020', '--title=Test Site', `--admin_user=${settings.wordpress.admin_user}`, `--admin_password=${settings.wordpress.admin_password}`, `--admin_email=${settings.wordpress.admin_email}`, '--skip-email', `--path=${theCWD}/build/wordpress`]))

		.then(() => execa('wp', ['option', 'update', 'timezone_string', 'America/Chicago', `--path=${theCWD}/build/wordpress`]))
		.then(() => execa('wp', ['option', 'update', 'start_of_week', '0', `--path=${theCWD}/build/wordpress`]))
		.then(() => execa('wp', ['option', 'update', 'siteurl', 'http://127.0.0.1:3020', `--path=${theCWD}/build/wordpress`]))
		.then(() => execa('wp', ['option', 'update', 'home', 'http://127.0.0.1:3020', `--path=${theCWD}/build/wordpress`]))

		.then(() => execa('wp', ['rewrite', 'structure', '/%postname%/', `--path=${theCWD}/build/wordpress`]))

		.then(() => execa('wp', ['plugin', 'uninstall', '--all', '--deactivate', `--path=${theCWD}/build/wordpress`]))

		.then(() => execa('wp', ['post', 'delete', '1', '2', '3', '--force', `--path=${theCWD}/build/wordpress`]))


		.then(() => {
			spinner.succeed();
			printNextSteps();
		})

};
