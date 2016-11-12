module.exports = function(grunt) {
    grunt.initConfig({
        browserify: {
            bundle: {
                src: 'client/main.js',
                dest: 'build/static/game.js'
            },
        },
        trimtrailingspaces: {
            all: {
                src: ['client/**/*.js', 'server/**/*.js', 'Gruntfile.js'],
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
        }
    });
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-trimtrailingspaces');

    grunt.registerTask('build', ['trimtrailingspaces:all',
            'browserify:bundle']);
    grunt.registerTask('default', ['build', 'watch']);

};
