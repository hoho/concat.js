module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            src: {
                src: ['concat.js'],
                options: {
                    jshintrc: '.jshintrc'
                }
            },
            compiler: {
                src: ['concatizer/core.js', 'concatizer/browser.js', 'concatizer/bin/concatize'],
                options: {
                    jshintrc: 'concatizer/.jshintrc'
                }
            },
            grunt: {
                src: ['Gruntfile.js'],
                options: {
                    jshintrc: '.jshintrc'
                }
            }
        },
        uglify: {
            options: {
                preserveComments: 'some',
                report: 'gzip'
            },
            build: {
                src: 'concat.js',
                dest: 'concat.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['jshint', 'uglify']);
};
