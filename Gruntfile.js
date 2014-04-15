module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.initConfig({
        typescript: {
            base: {
                src: ['src/**/*.ts'],
                dest: 'build',
                options: {
                    target: 'es5',
                    basePath: 'src',
                    module: 'commonjs',
                    sourceMap: true
                }
            }
        },
        watch: {
            files: 'src/**/*.ts',
            tasks: ['typescript']
        }
    });
    grunt.registerTask('default', 'watch');
};
