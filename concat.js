/*!
 * concat.js — v0.0.3 — 2013-07-09
 * https://github.com/hoho/concat.js
 *
 * Copyright (c) 2013 Marat Abdullin
 * Released under the MIT license
 */
(function(document, undefined) {
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
                this._ = [this._c = {
                    D: parent,
                    P: document.createDocumentFragment(),
                    _: []
                }];
            },

        run =
            function(item) {
                var R, i, j, oldArgs = curArgs, oldEachArray = eachArray;

                if (item.E !== undefined) {
                    curArgs = [-1, null];
                    eachArray = item.E;

                    R = function() {
                        j = ++curArgs[0];
                        curArgs[1] = eachArray[j];
                        return j < eachArray.length;
                    };
                } else if (item.R !== undefined) {
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
                    A: self._c,
                    F: func,
                    _: []
                };

                self._c._.push(ret);

                return ret;
            };

    constr.prototype = proto;

    proto.repeat = function(num) {
        var item = Item(this);

        item.R = num;

        this._c = item;

        return this;
    };

    proto.each = function(arr) {
        var item = Item(this);

        item.E = arr;

        this._c = item;

        return this;
    };

    proto.end = function(num) {
        if (num === undefined) { num = 1; }

        while (num > 0 && (this._c = this._c.A)) {
            num--;
        }

        if (this._c) { return this; }

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
                a, prop, val, tmp;

            for (i in attr) {
                a = attr[i];

                if (isFunction(a)) { a = a.apply(item.P, curArgs); }

                if (a !== undefined) {
                    if (i === 'style') {
                        if (typeof a === 'object') {
                            val = [];

                            for (prop in a) {
                                tmp = a[prop];

                                tmp = isFunction(tmp) ? tmp.apply(item.P, curArgs) : tmp;

                                if (tmp !== undefined) {
                                    val.push(prop + ': ' + tmp);
                                }
                            }

                            a = val.join('; ');
                        }

                        if (a) {
                            e.style.cssText = a;
                        }
                    } else {
                        e.setAttribute(i, a);
                    }
                }
            }

            item.A.P.appendChild(e);
        });

        this._c = item;

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
})(document);
