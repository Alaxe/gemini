module.exports = function(grunt) {
    grunt.initConfig({
        browserify: {
            bundle: {
                src: 'client/main.js',
                dest: 'build/game.js'
            },
        },
        trimtrailingspaces: {
            all: {
                src: ['client/**/*.js*', 'server/**/*.js*', 'Gruntfile.js'],
                options: {
                    filter: 'isFile',
                    failIfTrimmed: false
                }
            }
        },
        watch: {
            bundle: {
                files: ['client/**/*.js', 'client/**/*.json'],
                tasks: 'browserify:bundle'
            },
        },
        copy: {
            bundle: {
                files: [{
                    src: 'node_modules/phaser-input/build/phaser-input.js',
                    dest: 'build/phaser-input.js'
                }]
            }
        }
    });
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-trimtrailingspaces');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('build', ['trimtrailingspaces:all',
            'browserify:bundle', 'copy:bundle']);
    grunt.registerTask('default', ['build', 'watch']);

};
