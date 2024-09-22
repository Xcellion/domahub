var gulp = require("gulp");
var sass = require("gulp-sass")(require("sass")); // updated gulp-sass v5+
var cleanCSS = require("gulp-clean-css");
var rename = require("gulp-rename");
var uncss = require("gulp-uncss");
var moment = require("moment");
var gls = require("gulp-live-server");

// task to build sass, minify css, and output to destination
gulp.task("build", function () {
  return gulp
    .src("server/public/sass/**/*.scss")
    .pipe(sass()) // gulp-sass module - converts sass to css
    .pipe(rename({ dirname: "" }))
    .pipe(cleanCSS())
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(gulp.dest("server/public/css/min"));
});

// task to watch scss files for changes and trigger build
gulp.task("watch", function () {
  gulp
    .watch("server/public/sass/**/*.scss", gulp.series("build"))
    .on("change", function (file) {
      console.log(moment().format("hh:mm:ss") + " - Gulp! Delicious.");
    });
});

// task to start the server
gulp.task("connect", function () {
  var server = gls.new(".server/server.js");
  return server.start();
});

// default task to run build, watch, and connect in parallel
gulp.task("default", gulp.series("build", gulp.parallel("watch", "connect")));

// optional sprite and un-css tasks if needed in the future

// gulp.task('un-css', function() {
//   return gulp.src('server/public/css/master.css')
//     .pipe(uncss({
//       html: ['server/views/main/*.ejs', 'server/views/templates/footer.ejs', 'server/views/templates/navbar.ejs']
//     }))
//     .pipe(gulp.dest('server/public/css/uncssed'));
// });

// gulp.task('sprite', function() {
//   var spritesmith = require('gulp.spritesmith');
//   var spriteData = gulp.src('server/public/images/dh-assets/flat-logo/*.png')
//     .pipe(spritesmith({
//       imgName: 'dh-flat-logo-sprite.png',
//       cssName: 'sprite.css'
//     }));
//     spriteData.img.pipe(gulp.dest('server/public/images/dh-assets/flat-logo/'));
//     spriteData.css.pipe(gulp.dest('server/public/images/dh-assets/flat-logo/'));
// });
