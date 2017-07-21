import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as ObjectAssign from 'object-assign';
import * as webpack from 'webpack';
import * as LoaderUtils from 'loader-utils';
import * as Handlebars from 'handlebars';

/**
 * Options for the loader
 */
export class HandlebarsStaticLoaderOptions {
    /** Output debugging information to rendered HTML */
    debug = false;
    /** Data to pass to the template */
    data: any | string = {};
    /** A file glob of partials to load */
    partials: string;
    /** A function that returns a name for the partial */
    partialNamer = defaultPartialNamer;
    /** A file glob of helpers to load */
    helpers: string;
    /** A function that returns a name for the helper */
    helperNamer = defaultHelperNamer
};

/**
 * Webpack loader for Handlebars templates used as entry points
 * 
 * Includes support for data, partials & helpers
 */
export default function HandlebarsStaticLoader(this: webpack.loader.LoaderContext, source: string): string {

    // Merge options with defaults
    const options = ObjectAssign(defaultOptions, LoaderUtils.getOptions(this));

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

    // TODO: Handlebars Decorators
    // https://github.com/wycats/handlebars.js/blob/master/docs/decorators-api.md

    // Decorate template with debugging info
    source = decorateTemplate(source, this.resource, data, options);

    // TODO: Figure out why ExtractTextPlugin isn't removing .js & .map files

    // Compile the template with data & return
    return Handlebars.compile(source)(data);

}

/** Default options */
const defaultOptions = new HandlebarsStaticLoaderOptions();

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
function loadPartials(loaderContext: webpack.loader.LoaderContext, options: HandlebarsStaticLoaderOptions) {
    // TODO: Deal with arrays of globs
    glob.sync(options.partials).forEach(partial => {

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

}

/**
 * Loads helpers
 */
function loadHelpers(loaderContext: webpack.loader.LoaderContext, options: HandlebarsStaticLoaderOptions) {
    // TODO: Deal with arrays of globs
    glob.sync(options.helpers).forEach(helper => {

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
}

/**
 * Wraps Handlebars template source with debugging information if enabled 
 */
function decorateTemplate(source: string, resource: string, data: any, options: HandlebarsStaticLoaderOptions): string {
    const prefix = options.debug ? `<!-- handlebars-entry-loader:template
           src="${resource}"
           data=\'\n${JSON.stringify(data, null, 2)}\n\' -->\n` : '';
    const suffix = options.debug ? '<!-- /handlebars-entry-loader:template -->' : '';

    return prefix + source + suffix;
}

/**
 * Wraps Handlebars partial source with debugging information if enabled 
 */
function decoratePartial(source: string, partialName: string, partialSrc: string, options: HandlebarsStaticLoaderOptions): string {
    const prefix = options.debug ? `<!-- handlebars-entry-loader:partial name="${partialName}" src="${partialSrc}" -->\n` : '';
    const suffix = options.debug ? `<!-- /handlebars-entry-loader:partial name="${partialName}" -->\n` : '';

    return prefix + source + suffix;
}

/**
 * Returns a partial name based on path
 * @param {string} partial - the path to the partial
 */
export function defaultPartialNamer(partial: string): string {
    return partial;
}

/**
 * Returns a helper name based on path
 * @param {string} helper - the path to the helper
 */
export function defaultHelperNamer(helper: string): string {
    return helper;
}
