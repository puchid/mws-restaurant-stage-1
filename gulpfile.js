var gulp = require('gulp');
var browserSync = require('browser-sync');
var eslint = require('gulp-eslint');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var replaceext = require('replace-ext');
var rename = require('gulp-rename');
var babel = require('gulp-babel');
var copy = require('gulp-copy');
var autoprefixer = require('gulp-autoprefixer');
var del = require('del');
var reload = browserSync.reload;


gulp.task('clean', function() {
  return del(['dist']);
});

gulp.task('build',['clean'],() => {

gulp.src(['node_modules/**/*.*'])
.pipe(gulp.dest('dist/node_modules'));

gulp.src(['sw.js'])
.pipe(gulp.dest('dist/'));

gulp.src(['app/js/*.js'])
  .pipe(sourcemaps.init())
  .pipe(babel({
            presets: ['env']
        }))
  .pipe(eslint({'useEslintrc':false}))
  .pipe(eslint.format())
  .pipe(concat('bundle.js'))
  .pipe(sourcemaps.write())
  .pipe(uglify())
  .pipe(gulp.dest('dist'));

  gulp.src(['app/index.html','app/restaurant.html'])
  .pipe(gulp.dest('dist/'));

  gulp.src(['app/css/*.css'])
  .pipe(gulp.dest('dist/css/'));

  gulp.src(['app/images/*.*'])
  .pipe(gulp.dest('dist/images/'));

});

// watch files for changes and reload
gulp.task('serve', function() {
  browserSync({
    server: {
      baseDir: 'app'
    }
  });

gulp.task('default', function() {
  gulp.src(['app/js/*.js'])
  .pipe(sourcemaps.init())
  .pipe(babel({presets:['env']}))
  .pipe(eslint({useEslintrc:false}))
  .pipe(eslint.format())
  .pipe(sourcemaps.write())
  .pipe(uglify())
});


gulp.watch(['*.html', 'css/*.css', 'js/*.js'], ['build'],{cwd: 'app'}, reload);

//gulp.watch(['./dist/*.*'], {cwd: 'dist'}, reload);
});
