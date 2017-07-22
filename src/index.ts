import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as webpack from 'webpack';
import * as LoaderUtils from 'loader-utils';
import * as Handlebars from 'handlebars';

/**
 * Options for the loader
 */
export class HandlebarsEntryLoaderOptions {
    /** Output debugging information to rendered HTML */
    debug = false;
    /** Data to pass to the template */
    data: any | string = {};
    /** A file glob of partials to load */
    partials: string | Array<string>;
    /** A function that returns a name for the partial */
    partialNamer = defaultPartialNamer;
    /** A file glob of helpers to load */
    helpers: string | Array<string>;
    /** A function that returns a name for the helper */
    helperNamer = defaultHelperNamer
    /** A file glob of decorators to load */
    decorators: string | Array<string>;
    /** A function that returns a name for the decorator */
    decoratorNamer = defaultHelperNamer
    /** Prevent Webpack from outputting .js files */
    preventJsOutput = true;
};

/**
 * Webpack loader for Handlebars templates used as entry points
 * 
 * Includes support for data, partials, helpers & decorators
 */
export default function HandlebarsEntryLoader(this: webpack.loader.LoaderContext, source: string): string {

    // Merge options with defaults
    const options = { ...defaultOptions, ...LoaderUtils.getOptions(this) };

    // Get data
    const data = getData(this, options.data);

    // Load partials
    if (options.partials) {
        loadPartials(this, options);
    }

    // Load helpers
    if (options.helpers) {
        loadHelpers(this, options);
    }

    // Load decorators
    if (options.decorators) {
        loadDecorators(this, options);
    }

    // Prevent JS output
    if (options.preventJsOutput) {
        this._compiler.plugin('emit', preventJsOutputPlugin(this.resource, this.context));
    }

    // TODO: Handlebars Decorators
    // https://github.com/wycats/handlebars.js/blob/master/docs/decorators-api.md

    // Decorate template with debugging info
    source = decorateTemplate(source, this.resource, data, options);

    // Compile the template with data & return
    return Handlebars.compile(source)(data);

}

/** Default options */
const defaultOptions = new HandlebarsEntryLoaderOptions();

/**
 * Loads data
 */
function getData(loaderContext: webpack.loader.LoaderContext, data: string | any): any {

    // If data is a file path, load it as a dependency
    if (typeof data === 'string') {

        // Resolve path to data file
        const dataFile = path.resolve(data);

        // Remove from require cache
        delete require.cache[dataFile];

        // Add as a dependency so that Webpack updates on change
        loaderContext.addDependency(dataFile);

        // Import data
        data = require(dataFile);
    }

    return data;
}

/**
 * Loads partials
 */
function loadPartials(loaderContext: webpack.loader.LoaderContext, options: HandlebarsEntryLoaderOptions) {

    // Handle partials as a glob string, or an array of globs
    let partials: Array<string>;
    if (typeof options.partials === 'string') {
        partials = [options.partials];
    } else {
        partials = options.partials;
    }

    partials.forEach(partialGlob => {
        glob.sync(partialGlob).forEach(partial => {

            // Resolve partial name & path
            const partialName = options.partialNamer.call(loaderContext, partial);
            const partialPath = path.resolve(partial);

            // Decorate partial with debugging info
            const source = decoratePartial(fs.readFileSync(partialPath, 'utf-8'), partialName, partial, options);

            // Add as a dependency so that Webpack updates on change
            loaderContext.addDependency(partialPath);

            // Register the partial
            Handlebars.registerPartial(partialName, source);
        });
    });

}

/**
 * Loads helpers
 */
function loadHelpers(loaderContext: webpack.loader.LoaderContext, options: HandlebarsEntryLoaderOptions) {

    // Handle helpers as a glob string, or an array of globs
    let helpers: Array<string>;
    if (typeof options.helpers === 'string') {
        helpers = [options.helpers];
    } else {
        helpers = options.helpers;
    }

    helpers.forEach(helperGlob => {
        glob.sync(helperGlob).forEach(helper => {

            // Resolve helper name & path
            const helperName = options.helperNamer.call(loaderContext, helper);
            const helperPath = path.resolve(helper);

            // Add as a dependency so that Webpack updates on change
            loaderContext.addDependency(helperPath);

            // Remove from require cache
            delete require.cache[require.resolve(helperPath)];

            // Register the helper
            Handlebars.registerHelper(helperName, require(helperPath).default);
        });

    });
}

/**
 * Loads decorators
 */
function loadDecorators(loaderContext: webpack.loader.LoaderContext, options: HandlebarsEntryLoaderOptions) {

    // Handle decorators as a glob string, or an array of globs
    let decorators: Array<string>;
    if (typeof options.decorators === 'string') {
        decorators = [options.decorators];
    } else {
        decorators = options.decorators;
    }

    decorators.forEach(decoratorGlob => {
        glob.sync(decoratorGlob).forEach(decorator => {

            // Resolve decorator name & path
            const decoratorName = options.decoratorNamer.call(loaderContext, decorator);
            const decoratorPath = path.resolve(decorator);

            // Add as a dependency so that Webpack updates on change
            loaderContext.addDependency(decoratorPath);

            // Remove from require cache
            delete require.cache[require.resolve(decoratorPath)];

            // Register the decorator
            Handlebars.registerDecorator(decoratorName, require(decoratorPath).default);
        });

    });
}

/**
 * Wraps Handlebars template source with debugging information if enabled 
 */
function decorateTemplate(source: string, resource: string, data: any, options: HandlebarsEntryLoaderOptions): string {
    const prefix = options.debug ? `<!-- handlebars-entry-loader:template
           src="${resource}"
           data=\'\n${JSON.stringify(data, null, 2)}\n\' -->\n` : '';
    const suffix = options.debug ? '<!-- /handlebars-entry-loader:template -->' : '';

    return prefix + source + suffix;
}

/**
 * Wraps Handlebars partial source with debugging information if enabled 
 */
function decoratePartial(source: string, partialName: string, partialSrc: string, options: HandlebarsEntryLoaderOptions): string {
    const prefix = options.debug ? `<!-- handlebars-entry-loader:partial name="${partialName}" src="${partialSrc}" -->\n` : '';
    const suffix = options.debug ? `<!-- /handlebars-entry-loader:partial name="${partialName}" -->\n` : '';

    return prefix + source + suffix;
}

/**
 * Returns a partial name based on path
 * @param {string} partial - the path to the partial
 */
export function defaultPartialNamer(partial: string): string {
    return path.basename(partial, path.extname(partial));
}

/**
 * Returns a helper name based on path
 * @param {string} helper - the path to the helper
 */
export function defaultHelperNamer(helper: string): string {
    return path.basename(helper, path.extname(helper));
}

function preventJsOutputPlugin(resource: string, context: string) {

    let entryName: string;
    return (compilation: any, callback: Function) => {

        for (let i in compilation.options.entry) {

            // Check if entry point is an array
            let entry = compilation.options.entry[i];
            if (typeof entry !== 'string' && entry.pop) {
                // Assume that the last entry is the one we want
                entry = entry.pop();
            }

            if (typeof entry === 'string' && path.resolve(entry) === resource) {
                entryName = i;
                break;
            }
        }

        if (entryName !== undefined) {
            delete compilation.assets[entryName + '.js'];
        }

        callback();

    }
}
