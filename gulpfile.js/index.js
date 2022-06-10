const gulp = require('gulp');
const $ = require('gulp-load-plugins')({ lazy: false });
const autoprefixer = require('autoprefixer');
const minimist = require('minimist');
const browserSync = require('browser-sync').create();
const { envOptions } = require('./envOptions');

let options = minimist(process.argv.slice(2), envOptions);
//現在開發狀態
console.log(`Current mode：${options.env}`);

function copyFile() {
  return gulp.src(envOptions.copyFile.src)
  .pipe(gulp.dest(envOptions.copyFile.path))
  .pipe(
    browserSync.reload({
      stream: true,
    }),
  );
}

// 自製的template layout
function layoutHTML() {
  return gulp.src(envOptions.html.src) //編譯目前路徑
    .pipe($.plumber())
    .pipe($.frontMatter())
    .pipe(
      $.layout((file) => {
        return file.frontMatter;
      })
    )
    .pipe(gulp.dest(envOptions.html.path)) // 輸出到dist的資料夾內
    .pipe(
      browserSync.reload({
        stream: true,
      }),
    );
}

// sass的編譯
function sass() {
  const plugins = [
    autoprefixer(),
  ];
  return gulp.src(envOptions.style.src) //編譯目標sass檔
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss(plugins))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(envOptions.style.path)) //輸出到指定的路徑去
    .pipe(
      browserSync.reload({
        stream: true,
      }),
    );
}

function babel() {
  return gulp.src(envOptions.javascript.src)
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env'],
    }))
    .pipe($.concat(envOptions.javascript.concat))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(envOptions.javascript.path))
    .pipe(
      browserSync.reload({
        stream: true,
      }),
    );
}

function vendorsJs() {
  return gulp.src(envOptions.vendors.src)
    .pipe($.concat(envOptions.vendors.concat))
    .pipe(gulp.dest(envOptions.vendors.path));
}


function browser() {
  browserSync.init({
    server: {
      baseDir: envOptions.browserDir,
    },
    port: 8080,
  });
}

function clean() {
  return gulp.src(envOptions.clean.src, {
      read: false,
      allowEmpty: true,
    })
    .pipe($.clean());
}

function deploy() {
  return gulp.src(envOptions.deploySrc)
    .pipe($.ghPages());
}

// watch html,scss...etc.檔案是否有更新，若有更新則會自動執行
function watch() {
  gulp.watch(envOptions.html.src, gulp.series(layoutHTML));
  gulp.watch(envOptions.html.ejsSrc, gulp.series(layoutHTML));
  gulp.watch(envOptions.javascript.src, gulp.series(babel));
  gulp.watch(envOptions.img.src, gulp.series(copyFile));
  gulp.watch(envOptions.style.src, gulp.series(sass));
}

exports.deploy = deploy;

exports.clean = clean;

exports.build = gulp.series(clean, copyFile, layoutHTML, sass, babel, vendorsJs);

exports.default = gulp.series(clean, copyFile, layoutHTML, sass, babel, vendorsJs, gulp.parallel(browser, watch));
