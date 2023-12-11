var fs = require('fs'),
    rjs = require('requirejs'),
    UglifyJS = require('uglify-js');

rjs.optimize({
    optimize: 'none',

    baseUrl: 'src',
    paths: {
      'cestino': '.',
      'atomicjs/dist/atomic.min': 'empty:'
    },
    include: [
      'cestino/BasicCartService',
      'cestino/Cart',
      'cestino/PriceFormatter'
    ],
    out: function (text, sourceMapText) {
        fs.writeFileSync('dist/cestino.js', text);
        fs.writeFileSync(
            'dist/cestino.min.js',
            UglifyJS.minify(text, {compress: {sequences: false}}).code
        );
    },
    wrap: {
        end: ["if (typeof define === 'function' && define.amd) {\n",
            "    define(['cestino/Cart'], function (Cart) { return Cart; });\n",
            "}\n"
        ].join('')
    },

    preserveLicenseComments: false,
    skipModuleInsertion: true,
    findNestedDependencies: true
}, function (buildResponse) {
    console.log(buildResponse);
    resolve(buildResponse);
});