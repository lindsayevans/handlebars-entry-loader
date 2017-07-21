/**
 * Example Webpack configuration for Handlebars Entry Loader
 */

const path = require('path');

// Load the Extract Text Plugin - this will allow us to output HTML files
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExtractHandlebars = new ExtractTextPlugin({
    allChunks: false,
    filename: '[name].html'
});

module.exports = {
    entry: {
        // Handlebars entry points
        // Format is:
        // 'output/path': 'handlebars/template.hbs'
        // `.html` will be appended by ExtractTextPlugin, so you don't need to add that to the output path 

        // Outputs `dist/index.html`
        'index': './src/templates/homepage.hbs',
        // Outputs `goats/are/great.html`
        'goats/are/great': './src/templates/goats.hbs',
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
    },
    module: {
        loaders: [
            {
                test: /\.hbs$/,
                use: ExtractHandlebars.extract([
                    {
                        loader: 'html-loader',
                        options: {
                            minimize: false
                        }
                    },
                    {
                        loader: 'handlebars-entry-loader',
                        options: {

                            // Output debugging comments in HTML
                            debug: true,

                            // Load all of the .hbs files in `src/partials` directory & subdirectories as partials
                            partials: 'src/partials/**/*.hbs',

                            // A partial loaded from `src/partials/foo.hbs` will be named `foo`
                            // A partial loaded from `src/partials/foo/bar.hbs` will be named `foo/bar`
                            partialNamer: function(partial) {
                                return partial
                                    .replace('src/partials/', '')
                                    .replace('.hbs', '');
                            },

                            // Load all of the .js files in `src/helpers` directory as helpers
                            helpers: 'src/helpers/*.js',

                            // A partial loaded from `src/helpers/foo.js` will be named `foo`
                            helperNamer: function(helper) {
                                return helper
                                    .replace('src/helpers/', '')
                                    .replace('.js', '');
                            },

                            // Load the JSON file in `src/data/goats.json`
                            // Will be passed as a JS object to the Handlebars compiler
                            data: 'src/data/goats.json'

                            // You can also provide a JS object:
                            // data: {
                            //     foo: 'Foo',
                            //     bar: 'Bar'
                            // }

                        }
                    },
                ])
            },
        ]
    },
    plugins: [
        ExtractHandlebars
    ]
};
