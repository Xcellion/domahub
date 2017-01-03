var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function() {
  return gulp.src('server/public/sass/**/*.+(scss|sass)')
    .pipe(sass()) // gulp-sass module - converts sass to css
    .pipe(gulp.dest('server/public/css'));
});

gulp.task('watch', function() {
  gulp.watch('server/public/sass/**/*.+(scss|sass)', ['sass']);
})
