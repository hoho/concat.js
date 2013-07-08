/*!
 * Concat.JS — v0.0.2 — 2013-07-01
 * https://github.com/hoho/concat.js
 *
 * Copyright (c) 2013 Marat Abdullin
 * Released under the MIT license
 */
(function() {
    var tags = 'div|span|p|a|ul|ol|li|table|tr|td|th|br|img|b|i|s|u'.split('|'),
        proto = {},
        i,
        curArgs, eachArray,
        isFunction =
            function(func) {
                return typeof func === 'function';
            },

        constr =
            function(parent) {
                // D — node to append the result to (if any).
                // P — item's parent node.
                // A — item's parent item.
                // F — a function to call before processing subitems.
                // R — how many times to repeat this item.
                // E — an array for each().
                // _ — subitems.
                this._cur = {
                    D: parent,
                    P: document.createDocumentFragment(),
                    _: []
                };

                this._ = [this._cur];
            },

        run =
            function(item) {
                var R, i = 0, j, oldArgs = curArgs, oldEachArray = eachArray;

                if (item.E) {
                    curArgs = [-1, null];
                    eachArray = item.E;

                    R = function() {
                        j = ++curArgs[0];
                        curArgs[1] = eachArray[j];
                        return j < eachArray.length;
                    };
                } else if (item.R) {
                    curArgs = [-1];
                    eachArray = undefined;

                    R = isFunction(item.R) ?
                        function() {
                            return item.R.call(item.A.P, 1 + curArgs[0]++);
                        }
                        :
                        function() {
                            return curArgs[0]++ < item.R - 1;
                        };
                } else {
                    i = 1;
                }

                while ((!R && i--) || (R && R())) {
                    if (R) { item.P = item.A.P; }

                    item.F && item.F();

                    for (j = 0; j < item._.length; j++) {
                        run(item._[j]);
                    }
                }

                curArgs = oldArgs;
                eachArray = oldEachArray;
            },

        Item =
            function(self, func) {
                var ret = {
                    A: self._cur,
                    F: func,
                    _: []
                };

                self._cur._.push(ret);

                return ret;
            };

    constr.prototype = proto;

    proto.repeat = function(num) {
        var item = Item(this);

        item.R = num;

        this._cur = item;

        return this;
    };

    proto.each = function(arr) {
        var item = Item(this);

        item.E = arr;

        this._cur = item;

        return this;
    };

    proto.end = function() {
        if (this._cur = this._cur.A) {
            return this;
        }

        var r = this._[0];

        run(r);

        if (r.D) {
            r.D.appendChild(r.P);
        } else {
            return r.P;
        }
    };

    proto.elem = function(name, attr) {
        var item = Item(this, function() {
            var e = item.P = document.createElement(name),
                a;

            for (i in attr) {
                a = attr[i];

                if (isFunction(a)) { a = a.apply(item.P, curArgs); }

                if (i === 'style') {
                    e.style.cssText = a;
                } else {
                    e.setAttribute(i, a);
                }
            }

            item.A.P.appendChild(e);
        });

        this._cur = item;

        return this;
    };

    // Shortcuts for popular tags, to use .div() instead of .elem('div').
    for (i = 0; i < tags.length; i++) {
        proto[tags[i]] = (function(name) {
            return function(attr) {
                return this.elem(name, attr);
            };
        })(tags[i]);
    }

    proto.text = function(text) {
        var item = Item(this, function() {
            item.A.P.appendChild(
                document.createTextNode(
                    isFunction(text) ? text.apply(item.A.P, curArgs) : text
                )
            );
        });

        return this;
    };

    proto.do = function(func) {
        var item = Item(this, function() {
            func.apply(item.A.P, curArgs);
        });

        return this;
    };

    window.$C = function(parent) {
        return new constr(parent);
    };
})();
