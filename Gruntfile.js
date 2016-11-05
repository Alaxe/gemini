module.exports = function(grunt) {
    grunt.initConfig({
        browserify: {
            bundle: {
                src: 'src/main.js',
                dest: 'build/game.js'
            },
        },
        connect: {
            server: {
                options: {
                    port: 8000,
                    directory: '.'
                }
            }
        },
        watch: {
            bundle: {
                files: ['src/**/*.js', 'src/**/*.json'],
                tasks: 'browserify:bundle'
            }
        }
    });
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['browserify:bundle']);
    grunt.registerTask('default', ['browserify:bundle', 'connect', 'watch']);

};
