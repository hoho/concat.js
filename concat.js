/*!
 * concat.js — v0.0.6 — 2013-07-12
 * https://github.com/hoho/concat.js
 *
 * Copyright 2013 Marat Abdullin
 * Released under the MIT license
 */
(function(document, undefined) {
    // This code is being optimized for size, so some parts of it could be
    // a bit hard to read. But it is quite short anyway.

    var tags = 'div|span|p|a|ul|ol|li|table|tr|td|th|br|img|b|i|s|u'.split('|'),
        proto,
        i,
        curArgs = [], eachArray,
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
                    curArgs = [-1, undefined];
                    eachArray = item.E;

                    R = function() {
                        j = ++curArgs[0];
                        curArgs[1] = eachArray[j];

                        return j < eachArray.length;
                    };
                } else if (item.R !== undefined) {
                    curArgs = [-1];
                    eachArray = undefined;

                    R = function() {
                        return isFunction(item.R) ?
                            item.R.call(item.A.P, ++curArgs[0])
                            :
                            ++curArgs[0] < item.R;
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

    constr.prototype = proto = {
        repeat: function(num) {
            var item = Item(this);

            item.R = num;

            this._c = item;

            return this;
        },

        each: function(arr) {
            var item = Item(this);

            item.E = arr;

            this._c = item;

            return this;
        },

        end: function(num) {
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
        },

        elem: function(name, attr) {
            var item = Item(this, function(elem, a, prop, val, tmp) {
                elem = item.P = document.createElement(name);

                for (i in attr) {
                    if (isFunction(a = attr[i])) {
                        a = a.apply(elem, curArgs);
                    }

                    if (a !== undefined) {
                        if (i === 'style') {
                            if (typeof a === 'object') {
                                val = [];

                                for (prop in a) {
                                    if (isFunction(tmp = a[prop])) {
                                        tmp = tmp.apply(elem, curArgs);
                                    }

                                    if (tmp !== undefined) {
                                        val.push(prop + ': ' + tmp);
                                    }
                                }

                                a = val.join('; ');
                            }

                            if (a) {
                                elem.style.cssText = a;
                            }
                        } else {
                            elem.setAttribute(i, a);
                        }
                    }
                }

                item.A.P.appendChild(elem);
            });

            this._c = item;

            return this;
        },

        text: function(text) {
            var item = Item(this, function(t) {
                t = isFunction(text) ? text.apply(item.A.P, curArgs) : text;

                if (t !== undefined) {
                    item.A.P.appendChild(document.createTextNode(t));
                }
            });

            return this;
        },

        act: function(func) {
            var item = Item(this, function() {
                func.apply(item.A.P, curArgs);
            });

            return this;
        }
    };

    // Shortcuts for popular tags, to use .div() instead of .elem('div').
    for (i = 0; i < tags.length; i++) {
        proto[tags[i]] = (function(name) {
            return function(attr) {
                return this.elem(name, attr);
            };
        })(tags[i]);
    }

    window.$C = function(parent) {
        return new constr(parent);
    };
})(document);
