exports.default = function(program, props, container, context) {
    var helloHelper;
    var lang = context.args[0] || context.data.root.lang;

    switch (lang) {
        case 'en':
            helloHelper = function(name) {
                return 'Hello ' + name + '!';
            };
            break;
        case 'en-au':
            helloHelper = function(name) {
                return 'G\'day ' + name + '!';
            };
            break;
        case 'fr':
            helloHelper = function(name) {
                return 'Bonjour ' + name + '!';
            };
            break;
        default:
            console.warn('i18n decorator: Language not found \'' + lang + '\'');
            helloHelper = function(name) {
                return 'Hello ' + name + '!';
            };
    }

    container.helpers['helloTranslatedHelper'] = helloHelper;

};
