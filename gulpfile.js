var gulp = require('gulp');
var header = require('gulp-header');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var minifycss = require('gulp-minify-css');

var pkg = require('./package.json');
var banner = [
	'/*!',
	' * <%= pkg.name %> - <%= pkg.description %>',
	' * @version v<%= pkg.version %>',
	' * @link <%= pkg.homepage %>',
	' * @license <%= pkg.license %>',
	' */',
	''
].join('\n');


gulp.task('default', ['js', 'css']);

gulp.task('js', function() {
	gulp.src([
		'_header.js',
		'base.js',
		'Action.js',
		'base.js',
		'Action.js',
		'Cache.js',
		'Cursor.js',
		'Drag.js',
		'Element.js',
		'Html.js',
		'Injector.js',
		'Selection.js',
		'Toolbar.js',
		'Undoable.js',
		'Utilities.js',
		'environmentCorrection.js',
		'_footer.js'
	], { base: 'src/js/' })
	.pipe(concat('medium.js'))
	.pipe(header(banner, { pkg : pkg } ))
	.pipe(gulp.dest('./dist'))

	.pipe(concat('medium.min.js'))
	.pipe(uglify({preserveComments: 'some'}))
	.pipe(gulp.dest('./dist'));
});

gulp.task('css', function() {
	gulp.src([
		'src/css/medium.css'
	])
	.pipe(gulp.dest('./dist/'))

	.pipe(minifycss())
	.pipe(rename('medium.min.css'))
	.pipe(header(banner, { pkg : pkg } ))
	.pipe(gulp.dest('./dist/'));
});

gulp.task('lint', function () {
	return gulp.src('./src/js/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

