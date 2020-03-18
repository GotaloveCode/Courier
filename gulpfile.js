var gulp = require("gulp");

var tslint = require("gulp-tslint");

var tsc = require("gulp-typescript");

var tsProject = tsc.createProject("tsconfig.json");

var spsync = require("gulp-spsync-creds").sync;

var spdwn = require("gulp-spsync-creds").download;

var watch = require("gulp-watch");

var set = {
  username: "mat@test.org",
  password: "test",
  site: "https://test.sharepoint.com/sites/sp/hr",
  verbose: "true",
  publish: "true",
  libraryPath: "SiteAssets/Resource",
  cache: "true"
  // "startFolder": "SiteAssets/Resource"
};

gulp.task("default", function() {
  return gulp
    .src("src/SiteAssets/Resource/**/*.*")
    .pipe(watch("src/SiteAssets/Resource/**/*.*"))
    .pipe(spsync(set));
  //.pipe(gulp.dest('build'))
});

gulp.task("download", function() {
  return spdwn(set).pipe(gulp.dest("src/SiteAssets/Resource"));
});

gulp.task("lint", function() {
  return gulp
    .src(["src/ts/**/**.ts"])
    .pipe(
      tslint({
        formatter: "verbose"
      })
    )
    .pipe(tslint.report());
});

gulp.task("build-app", function() {
  return gulp
    .src([
      "src/ts/**/**.ts",
      "typings/main.d.ts/",
      "source/interfaces/interfaces.d.ts"
    ])
    .pipe(tsProject)
    .js.pipe(gulp.dest("source/"));
});
