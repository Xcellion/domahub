var gulp = require('gulp');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var uncss = require('gulp-uncss');
// var spritesmith = require('gulp.spritesmith');

gulp.task('sass', function() {
  return gulp.src('server/public/sass/**/*.scss')
    .pipe(sass()) // gulp-sass module - converts sass to css
    .pipe(gulp.dest('server/public/css'));
});

gulp.task('minify-css', function() {
  return gulp.src('server/public/css/*.css')
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('server/public/css/min'));
});

gulp.task('un-css', function() {
  return gulp.src('server/public/css/master.css')
    .pipe(uncss({
      html: ['server/views/main/*.ejs', 'server/views/templates/footer.ejs', 'server/views/templates/navbar.ejs']
    }))
    .pipe(gulp.dest('server/public/css/uncssed'));
});
//
// gulp.task('sprite', function() {
//   var spriteData = gulp.src('server/public/images/dh-assets/flat-logo/*.png')
//     .pipe(spritesmith({
//       imgName: 'dh-flat-logo-sprite.png',
//       cssName: 'sprite.css'
//     }));
//     spriteData.img.pipe(gulp.dest('server/public/images/dh-assets/flat-logo/'));
//     spriteData.css.pipe(gulp.dest('server/public/images/dh-assets/flat-logo/'));
// });

gulp.task('watch', function() {
  gulp.watch('server/public/sass/**/*.scss', ['sass']);
  gulp.watch('server/public/css/*.css', ['minify-css']);
});
