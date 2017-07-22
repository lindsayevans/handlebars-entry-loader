# Handlebars Entry Loader
[![NPM version](https://img.shields.io/npm/v/handlebars-entry-loader.svg?maxAge=3600)](https://travis-ci.org/lindsayevans/handlebars-entry-loader) [![Build status](https://img.shields.io/travis/lindsayevans/handlebars-entry-loader.svg?maxAge=3600)](https://www.npmjs.com/package/handlebars-entry-loader) [![Dependency status](https://img.shields.io/david/lindsayevans/handlebars-entry-loader.svg?maxAge=3600)](https://david-dm.org/lindsayevans/handlebars-entry-loader) [![bitHound dependencies](https://img.shields.io/bithound/dependencies/github/lindsayevans/handlebars-entry-loader.svg?maxAge=3600)](https://www.bithound.io/github/lindsayevans/handlebars-entry-loader/master/dependencies/npm)

Webpack loader to enable using Handlebars templates as entry points.

Similar to all of the other Handlebars loaders, but with 100% more TypeScript and goats!

Includes support for:
* Data
* Partials
* Helpers
* Decorators

## Usage

```javascript

const ExtractTextPlugin = require('extract-text-webpack-plugin');

const ExtractHandlebars = new ExtractTextPlugin({
    allChunks: false,
    filename: '[name].html'
});

module.exports = {
    entry: {
        'index': 'src/templates/homepage.hbs'
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
                            partials: 'src/partials/**/*.hbs',
                            helpers: 'src/helpers/**/*.helper.js',
                            data: 'src/data.json'
                        }
                    },
                ])
            },
        ]
    },
    plugins: [
        ExtractHandlebars
    ],
    output: {
        path: 'dist/'
    }
}
```

See [`src/examples`](./src/examples/) for more complex configurations.

## Options

### Data
```javascript
data: {}
```
Data to pass to the handlebars template.

Can either be a JavaScript Object `{foo: 'bar'}` or a path to a JSON file to load.

### Partials

File glob to load Handlebars Partials from.

Defaults to `null` (won't load any partials)

Example:

`config:`
```javascript
partials: 'src/partials/**/*.hbs'
```

`src/partials/foo/bar.hbs:`
```handlebars
<p>Hello {{name}}, I am foo/bar</p>
```

`something.hbs:`
```handlebars
{{> src/partials/foo/bar.hbs name="Something" }}
```

### Partial namer

By default partials will use the file name minus extension as the partial name, this may be undesirable (e.g. multiple partials with the same name in different directories)

To override this behaviour, provide a `partialNamer` function:
```javascript
partialNamer: function(partial) {
    return partial.replace('src/partials/', '').replace('.hbs', '');
}
```

`something.hbs`
```handlebars
{{> foo/bar }}
```


### Helpers


File glob to load Handlebars Partials from.

Defaults to `null` (won't load any partials)

Example:

`config:`
```javascript
helpers: 'src/helpers/**/*.helper.js'
```

`src/helpers/json.helper.js:`
```javascript
exports.default = function(data) {
    return JSON.stringify(data, null, ' ');
};
```

`something.hbs:`
```handlebars
<pre>{{src/helpers/json.helper.js someJSObject}}</pre>
```


### Helper namer

```javascript
helperNamer: helper => helper
```

By default helpers will use the file name minus extension as the helper name, this may be undesirable (e.g. multiple helpers with the same name in different directories)

To override this behaviour, provide a `helperNamer` function:
```javascript
helperNamer: function(helper) {
    return helper.replace('src/helpers/', '').replace('.js', '');
}
```

`something.hbs`
```handlebars
<pre>{{json someJSObject}}</pre>
```

### Decorators

Decorators follow the same config rules as helpers, using the following options:
```javascript
decorators: 'src/decorators/**/*.js',
helperNamer: function() {...}
```

### Debug

Set to `true` to wrap Handlebars templates & partials with HTML comments containing debugging information (name, path, data, etc.)

Useful to enable based on NODE_ENV:
```javascript
debug: process.env.NODE_ENV !== 'production'
```

### Prevent JS output

By default we prevent Webpack from emitting a `.js` file with each Handlebars entry point.

If this is causing issues with other loaders, you can turn it off:
```javascript
preventJsOutput: false
```
