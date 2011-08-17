/*!
* Clean Page Unload jQuery Plugin v1 
* https://github.com/silkster/BeforeUnload-jQuery-Plugin
*
* Dual licensed under the MIT or GPL Version 2 licenses.
* https://github.com/silkster/BeforeUnload-jQuery-Plugin/blob/master/license
*
*  Author: Dan Silk, http://plugins.jquery.com/users/silkster
*    Date: Thu Aug 12 16:15:00 2011 -0400
*
* REQUIRES jQuery - created with jQuery 1.6.1, but should work with previous versions.
*/

///<summary>
/// Register methods to call for the beforeunload and unload events of a page
///</summary>
$.CleanPageUnload = (function ($) {
    var cleaner = {};
    var settings = {
        debug: false,
        beforeUnloadMethods: [],   // methods that might need to prevent unloading the page
        unloadMethods: []          // methods that need to perform general clean-up task on unload
    };

    cleaner.isAjaxClick = false;

    var callMethodsInArray = function (methods) {
        for (var x = 0, len = methods.length; x < len; x++) {
            methods[x]();
        }
    };

    // this is the method that will run all methods in beforeUnloadMethods:
    var callBeforeUnloadMethods = function () {
        if (cleaner.isAjaxClick) {
            cleaner.isAjaxClick = false;
        } else {
            callMethodsInArray(settings.unloadMethods);
        }
    };

    var registerMethod = function (methodList, fn) {
        if (typeof fn == 'function') {
            if (!methodList.contains(function (item) {
                return item == fn;
            })) {
                methodList.push(fn);
            }
        }
    };

    cleaner.registerUnloadMethod = function (fn) {
        registerMethod(settings.unloadMethods, fn);
    };

    cleaner.registerBeforeUnloadMethod = function (fn) {
        registerMethod(settings.beforeUnloadMethods, fn);
    };

    var registercleanpageunload = function () {
        window.cleanpageunload = callBeforeUnloadMethods;
    };

    // attach all methods to window.cleanpageunload 
    cleaner.AttachTocleanpageunload = function () {
        var unloadMethod = window.cleanpageunload;
        var isWindowEventSet = typeof unloadMethod != 'undefined';
        if (isWindowEventSet && unloadMethod !== callBeforeUnloadMethods) cleaner.registerUnloadMethod(settings.beforeUnloadMethods, unloadMethod);
        registercleanpageunload();
    };

    // using $(document).bind('ready', fn) instead of $(document).ready() runs the ensures that these fns run after all other ready methods:
    $(document)
        .bind('ready', function () {
            cleaner.AttachTocleanpageunload();

            // register unload methods with jQuery.unload()
            for (var x = 0; x < settings.unloadMethods.length; x++) {
                $(document).unload(settings.unloadMethods[x]);
            }

            $(document).delegate('a', 'mousedown', function () {
                var a = $(this);
                var href = a.attr('href');
                var onclick = a.attr('onclick');
                var events = a.data('events');
                if (events && events['click'] || (href && (href.indexOf('javascript') >= 0 || onclick))) {
                    if ($.browser.msie) {
                        $(this).trigger('ajaxClick');
                    }
                } else {
                    callMethodsInArray(settings.unloadMethods);
                }
            });
            $(document).delegate('a[onclick]', 'keydown', function (e) {
                $(this).mousedown(e);
            });
        })
        .bind('ajaxClick', function () {
            cleaner.isAjaxClick = true;
        });

    cleaner.debug = function () {
        return settings.debug ? { cleanUnload: cleaner} : {};
    };

    document.CleanPageUnload = function (options) {
        if (typeof options == 'function') {
            // if options is a function, then register it with $.beforeUnload
            cleaner.registerUnloadMethod('unloadEvents', options);
        } else if (typeof options == 'string') {
            // if options is a string, then see if it is a method of $.beforeUnload and run it
            if (cleaner[options]) {
                var args = Array.prototype.slice.call(arguments, 0);
                if (args.length == 1) {
                    return cleaner[options]();
                } else {
                    var method = args.shift();
                    return cleaner[method].apply(this, args);
                }
            }
        } else if (typeof options == 'object') {
            // if options is an object, see if any of its properties are functions and register them with $.beforeUnload, 
            settings = $.extend(true, settings, options);
            for (var x = 0, fn, len = settings.unloadMethods.length; x < len; x++) {
                fn = settings.unloadMethods[x];
                if (typeof fn == 'function') {
                    cleaner.registerUnloadMethod(settings.unloadMethods, fn);
                }
            }
            len = settings.beforeUnloadMethods.length;
            for (x = 0; x < len; x++) {
                fn = settings.beforeUnloadMethods[x];
                if (typeof fn == 'function') {
                    cleaner.registerUnloadMethod(settings.beforeUnloadMethods, fn);
                }
            }
            registercleanpageunload();
        }
    };

})(jQuery);
