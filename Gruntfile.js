module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: {
                src: ['concat.js', 'Gruntfile.js'],
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
        },

        qunit: {
            all: ['test/**/*.html']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('assert-version', function() {
        var assertVersion = require('assert-version'),
            error;

        error = assertVersion({
            'concat.js': '',
            'concat.min.js': '',
            'bower.json': ''
        });

        if (error) {
            grunt.log.error(error);
            return false;
        }
    });

    grunt.registerTask('default', ['jshint', 'uglify', 'assert-version', 'qunit']);
};
