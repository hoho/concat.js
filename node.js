function xmlEscape(val, attr) {
    return val;
}


global.Node = function(type, name, val) {
    var self = this;

    self.type = type;
    self.name = name;
    self.val = val;
    self.attributes = {};
    self.children = [];

    Object.defineProperty(
        self,
        'innerHTML',
        {
            // Concat.js needs only innerHTML setter.
            set: function(val) {
                self.children = val ? [document.createTextNode(val)] : [];
            },
            enumerable: true,
            configurable: true
        }
    );

    Object.defineProperty(
        self,
        'firstChild',
        {get: function() { return self.children[0]; }}
    );

    self.style = {};

    Object.defineProperty(
        self.style,
        'cssText',
        {
            // Concat.js needs only cssText setter.
            set: function(val) {
                // TODO: Implement.
                console.log('cssText', val);
            },
            enumerable: true,
            configurable: true
        }
    );
};


global.Node.prototype = {
    appendChild: function(child) {
        if (child.type === 11) {
            child = child.children;
            for (var i = 0; i < child.length; i++) {
                this.children.push(child[i]);
            }
        } else {
            this.children.push(child);
        }
    },


    setAttribute: function(name, val) {
        this.attributes[name] = val;
    },

    stringify: function() {
        var ret = [],
            i,
            tmp;

        if (this.type === 11) {
            tmp = this.children;
            for (i = 0; i < tmp.length; i++) {
                ret.push(tmp[i].stringify());
            }
        } else {
            if (this.type === 1) {
                ret.push('<' + this.name);

                tmp = this.attributes;
                for (i in tmp) {
                    ret.push(' ' + i + '="' + xmlEscape(tmp[i], true) + '"');
                }

                ret.push('>');

                tmp = this.children;
                for (i = 0; i < tmp.length; i++) {
                    ret.push(tmp[i].stringify());
                }

                ret.push('</' + this.name + '>');
            } else if (this.type === 3) {
                ret.push(xmlEscape(this.val, false));
            }
        }

        return ret.join('');
    }
};


global.window = global;


global.document = {
    createDocumentFragment: function() {
        return new Node(11);
    },

    createElement: function(name) {
        return new Node(1, name);
    },

    createTextNode: function(val) {
        return new Node(3, undefined, val);
    }
};

//require('./node.js')
//require('./concat.js')
//$C().div().text('sss').end(2).dom.stringify()
