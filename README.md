# Handlebars Entry Loader
[![NPM version](https://img.shields.io/npm/v/handlebars-entry-loader.svg?maxAge=3600)](https://travis-ci.org/lindsayevans/handlebars-entry-loader) [![Build status](https://img.shields.io/travis/lindsayevans/handlebars-entry-loader.svg?maxAge=3600)](https://www.npmjs.com/package/handlebars-entry-loader) [![Dependency status](https://img.shields.io/david/lindsayevans/handlebars-entry-loader.svg?maxAge=3600)](https://david-dm.org/lindsayevans/handlebars-entry-loader) [![bitHound dependencies](https://img.shields.io/bithound/dependencies/github/lindsayevans/handlebars-entry-loader.svg?maxAge=3600)](https://www.bithound.io/github/lindsayevans/handlebars-entry-loader/master/dependencies/npm)

Webpack loader to enable using Handlebars templates as entry points.

Similar to all of the other Handlebars loaders, but with 100% more TypeScript and goats!

Includes support for:
* Data
* Partials
* Helpers

## Usage

```javascript

const ExtractTextPlugin = require('extract-text-webpack-plugin');

const ExtractHandlebars = new ExtractTextPlugin({
    allChunks: false,
    filename: '[name].html'
});

module.exports = {
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
                            partials: './src/components/**/*.hbs',
                            helpers: './src/helpers/**/*.helper.js',
                            data: './src/prototype/data.json'
                        }
                    },
                ])
            },
        ]
    },
    plugins: [
        ExtractHandlebars
    ],
    entry: {
        'index': 'src/pages/homepage.hbs',
        'pages/about': 'src/pages/about.hbs',
        'pages/admin/login': 'src/pages/admin/login.hbs',
        'prototype/index': 'src/prototype/index.hbs',
    }
    output: {
        path: path.join(__dirname, '../dist')
    }
}
```

See [examples](./examples/) for more complex configurations.

## Options

### Data
```javascript
data: {}
```
Data to pass to the handlebars template.

Can either be a JavaScript Object `{foo: 'bar'}` or a path to a JSON file to load.

### Partials
```javascript
partials: null
```

File glob to load Handlebars Partials from.
```javascript
partials: 'src/partials/**/*.hbs'
```

`src/partials/foo/bar.hbs`
```handlebars
<p>Hello {{name}}, I am foo/bar</p>
```

`something.hbs`
```handlebars
{{> src/partials/foo/bar.hbs name="Something" }}
```

### Partial namer

```javascript
partialNamer: partial => partial
```

By default partials will be use their full filename as the partial name, this may be undesirable (.hbs extension, ./src/ directory, etc.)

To override this behaviour, provide a `partialNamer` function:
```javascript
partialNamer: partial => {
    return partial.replace('./src/partials/', '').replace('.hbs', '');
}
```

`something.hbs`
```handlebars
{{> foo/bar }}
```


### Helpers
TODO

### Helper namer
TODO

### Debug
```javascript
debug: false
```

Set to `true` to wrap Handlebars templates & partials with HTML comments containing debugging information (name, path, data, etc.)

Useful to enable based on NODE_ENV:
```javascript
debug: process.env.NODE_ENV !== 'production'
```
