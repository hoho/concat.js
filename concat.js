/*!
 * Concat.JS — v0.0.1 — 2013-07-01
 * https://github.com/hoho/concatjs
 *
 * Copyright (c) 2013 Marat Abdullin
 * Released under the MIT license
 */
(function($) {
    var proxyfn = ['attr', 'css', 'text', 'html', 'on'],
        proto = {},

        constr =
            function(parent) {
                // P — item's parent node.
                // A — item's parent item.
                // F — a function to call before processing subitems.
                // R — how many times to repeat this item.
                // _ — subitems.
                // $ — $(P) cache (cached after first proxied to jQuery fn call).
                this._cur = {
                    P: parent,
                    R: 1,
                    _: []
                };

                this._ = [this._cur];
            },

        run =
            function(item) {
                var R, i;

                if ($.isFunction(item.R)) {
                    R = item.R;
                } else {
                    i = item.R;
                    R = function() {
                        return --i >= 0;
                    };
                }

                while (R()) {
                    item.$ = null;

                    item.F && item.F();

                    for (var j = 0; j < item._.length; j++) {
                        run(item._[j]);
                    }
                }
            },

        proxy =
            function(fn) {
                // Proxy jQuery function call.
                return function() {
                    var args = arguments,
                        cur = this._cur,
                        item = {
                            A: this._cur,
                            R: 1,
                            _: [],
                            F: function() {
                                if (!cur.$) { cur.$ = $(cur.P); }
                                cur.$[fn].apply(cur.$, args);
                            }
                        };

                    this._cur._.push(item);

                    return this;
                };
            };

    constr.prototype = proto;

    proto.repeat = function(num) {
        var item = {
            P: this._cur.P,
            A: this._cur,
            R: num,
            _: []
        };

        this._cur._.push(item);
        this._cur = item;

        return this;
    };

    proto.end = function() {
        if (this._cur = this._cur.A) {
            return this;
        }

        run(this._[0]);

        this._cur = this._ = null;
    };

    proto.elem = function(name) {
        var item = {
                P: null,
                A: this._cur,
                R: 1,
                _: []
            };

        item.F = function() {
            item.P = document.createElement(name);
            item.A.P.appendChild(item.P);
        };

        this._cur._.push(item);
        this._cur = item;

        return this;
    };

    for (var i = 0; i < proxyfn.length; i++) {
        proto[proxyfn[i]] = proxy(proxyfn[i]);
    }

    window.$C = function(parent) {
        return new constr(parent instanceof $ ? parent[0] : parent);
    };
})(jQuery);

