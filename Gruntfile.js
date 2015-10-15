module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            build: {
                files: {
                    'dist/kodi-client.js': ['src/**/*.js']
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
