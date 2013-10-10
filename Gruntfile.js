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
                src: ['Gruntfile.js', 'tasks/compile.js'],
                options: {
                    jshintrc: '.jshintrc'
                }
            }
        },

        clean: {
            concatizeTemplates: ['tmp']
        },

        concatizeTemplates: {
            ok: {
                files: {
                    'tmp/ok': ['concatizer/test/tpl1.ctpl', 'concatizer/test/tpl2.ctpl']
                }
            },
            empty: {
                files: {
                    'tmp/error': ['concatizer/test/tpl3.ctpl']
                }
            },
            nofile: {
                src: ['concatizer/test/tpl1.ctpl', 'this/file/is/not/there', 'concatizer/test/tpl2.ctpl'],
                dest: 'tmp/nofile',
                nonull: true
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

    grunt.loadTasks('tasks');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['jshint', 'clean', 'concatizeTemplates', 'uglify']);
};
