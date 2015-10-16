module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            options: {
                banner: '(function (root, factory) {if (typeof define === \'function\' && define.amd) {define([], factory);} else if (typeof exports === \'object\') {module.exports = factory();} else {root.KodiClient = factory();}}(this, function () {\n',
                footer: 'return KodiClient;}));',
                sourceMap: true
            },
            build: {
                files: {
                    'dist/kodi-client.js': [
                        'src/utils.js',
                        'src/exceptions.js',
                        'src/request.js',
                        'src/response.js',
                        'src/listenable.js',
                        'src/transports.js',
                        'src/request-validator.js',
                        'src/kodi-client.js'
                    ]
                }
            }
        },
        uglify: {
            build: {
                files: {
                    'dist/kodi-client.min.js': 'dist/kodi-client.js'
                }
            }
        },
        watch: {
            build: {
                files: ['./src/**/*js'],
                tasks: ['default']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['concat', 'uglify']);
    grunt.registerTask('dwatch', ['default', 'watch']);
};
