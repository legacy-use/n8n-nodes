const path = require('path');
const { task, src, dest } = require('gulp');

task('build:icons', copyIcons);

function copyIcons() {
	const nodeSource = path.resolve('nodes', 'LegacyUse', '*.{png,svg}');
	const nodeDestination = path.resolve('dist', 'nodes', 'LegacyUse');

	src(nodeSource).pipe(dest(nodeDestination));

	const credSource = path.resolve('credentials', 'LegacyUseApi*.{png,svg}');
	const credDestination = path.resolve('dist', 'credentials');

	return src(credSource).pipe(dest(credDestination));
}
