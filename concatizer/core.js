function concatizerTokenizeSelectorError(line, col, message) {
    throw message + ' (line: ' + line + ', col: ' + col + ')';
}


function concatizerTokenizeSelector(line, selector) {
    selector = selector.replace(/\s+$/g, '');

    var selectorLength = selector.length,
        className = [],
        attr = {},
        mods = {},
        elem,
        val = [],
        bemElem = [],
        what,
        i,
        whatCol,

        whitespace = /[\x20\t\r\n\f]/,
        attrName = /^[a-zA-Z][a-zA-Z0-9-_]*$/g,
        bemName = /^[a-zA-Z0-9-]+$/g,
        blockPrefixes = /^(?:b-|l-)[a-zA-Z0-9-]/,
        modSeparator = '_',
        elemSeparator = '__',

        processToken = function() {
            if (!val.length) {
                if (what === undefined) {
                    return;
                }

                concatizerTokenizeSelectorError(line, whatCol, 'No name');
            }

            val = val.join('');

            switch (what) {
                case '.':
                    if (!val.match(attrName)) {
                        concatizerTokenizeSelectorError(line, whatCol, "Illegal class name '" + val + "'");
                    }

                    if ('class' in attr) {
                        concatizerTokenizeSelectorError(line, whatCol, "Previously assigned 'class' attribute is being rewritten");
                    }

                    className.push(val);
                    break;

                case '#':
                    if ('id' in attr) {
                        concatizerTokenizeSelectorError(line, whatCol, "'id' attribute is already set");
                    }

                    attr.id = val;
                    break;

                case '%':
                    if (!val.match(bemName) || !val.match(blockPrefixes)) {
                        concatizerTokenizeSelectorError(line, whatCol, "Illegal block name '" + val + "'");
                    }

                    if (bemElem.length) {
                        if (!bemElem.match(bemName)) {
                            concatizerTokenizeSelectorError(line, whatCol, "Illegal element name '" + bemElem + "'");
                        }

                        val += elemSeparator + bemElem;
                        bemElem = [];
                    }

                    if ('class' in attr) {
                        concatizerTokenizeSelectorError(line, whatCol, "Previously assigned 'class' attribute is being rewritten");
                    }

                    className.push(val);

                    for (var name in mods) {
                        className.push(val + modSeparator + name + (mods[name] === true ? '' : modSeparator + mods[name]));
                    }

                    break;

                case undefined:
                    if (elem) {
                        concatizerTokenizeSelectorError(line, whatCol, "Duplicate tag name ('" + val + "')");
                    }
                    elem = val;
                    break;
            }

        },

        processAttrMod = function(closer) {
            var name = [],
                value = [],
                isString,
                attrmodCol = i;

            if (closer === '}' && what !== '%') {
                concatizerTokenizeSelectorError(line, i, 'Modifier has no block');
            }

            i++;

            while (i < selectorLength && whitespace.test(selector[i])) {
                i++;
            }

            while (i < selectorLength && !whitespace.test(selector[i]) && selector[i] !== '=' && selector[i] !== closer) {
                name.push(selector[i]);
                i++;
            }

            while (i < selectorLength && whitespace.test(selector[i])) {
                i++;
            }

            if (selector[i] === '=') {
                i++;
            }

            while (i < selectorLength && whitespace.test(selector[i])) {
                i++;
            }

            if (selector[i] !== closer) {
                if (selector[i] === '"') {
                    isString = true;
                    i++;
                }

                while (i < selectorLength) {
                    if (selector[i] === '"') {
                        if (isString) {
                            i++;
                            break;
                        } else {
                            concatizerTokenizeSelectorError(line, i, "Illegal symbol '" + selector[i] + "'");
                        }
                    } else if (selector[i] === '\\') {
                        if (isString) {
                            i++;

                            if (selector[i] === '\\') {
                                value.push('\\');
                            } else if (selector[i] === '"') {
                                value.push('"');
                            } else {
                                concatizerTokenizeSelectorError(line, i, "Illegal symbol '" + selector[i] + "'");
                            }

                            i++;
                        } else {
                            concatizerTokenizeSelectorError(line, i, "Illegal symbol '" + selector[i] + "'");
                        }
                    } else {
                        if (isString) {
                            value.push(selector[i]);
                        } else {
                            if (selector[i] === closer || whitespace.test(selector[i])) {
                                break;
                            } else {
                                value.push(selector[i]);
                            }
                        }

                        i++;
                    }
                }

                while (i < selectorLength && whitespace.test(selector[i])) {
                    i++;
                }
            }

            if (selector[i] !== closer) {
                if (i === selectorLength) {
                    concatizerTokenizeSelectorError(line, i, 'Unterminated selector');
                } else {
                    concatizerTokenizeSelectorError(line, i, "Unexpected symbol '" + selector[i] + "'");
                }
            }

            if (!name.length) {
                concatizerTokenizeSelectorError(line, attrmodCol, 'No ' + (closer === ']' ? 'attribute' : 'modifier') + ' name');
            }

            name = name.join('');
            value = value.join('');

            if (closer === ']' && !name.match(attrName)) {
                concatizerTokenizeSelectorError(line, attrmodCol, "Illegal attribute name '" + name + "'");
            } else if (closer === '}' && !name.match(bemName)) {
                concatizerTokenizeSelectorError(line, attrmodCol, "Illegal modifier name '" + name + "'");

                if (value && !value.match(bemName)) {
                    concatizerTokenizeSelectorError(line, attrmodCol, "Illegal modifier value '" + value + "'");
                }
            }

            if (closer === ']') {
                if (name in attr) {
                    concatizerTokenizeSelectorError(line, attrmodCol, "Attribute '" + name + "' is already set");
                }

                if (name === 'class' && className.length) {
                    concatizerTokenizeSelectorError(line, attrmodCol, "Previously assigned 'class' attribute is being rewritten");
                }

                attr[name] = value || name;
            } else {
                if (name in mods) {
                    concatizerTokenizeSelectorError(line, attrmodCol, "Modifier '" + name + "' is already set");
                }

                mods[name] = value || true;
            }

            i++;

            if (selector[i] === '[') {
                processAttrMod(']');
            } else if (selector[i] === '{') {
                processAttrMod('}');
            }
        };

    i = 0;

    while (i < selectorLength && whitespace.test(selector[i])) {
        i++;
    }

    while (i < selectorLength) {
        switch (selector[i]) {
            case '.':
            case '#':
            case '%':
                processToken();
                val = [];
                what = selector[i];
                whatCol = i + 1;
                i++;
                break;

            case '(':
                if (what !== '%') {
                    concatizerTokenizeSelectorError(line, i, 'Element without a block');
                }

                if (bemElem.length) {
                    concatizerTokenizeSelectorError(line, i, 'Duplicate element');
                }

                i++;

                bemElem = [];

                while (i < selectorLength && whitespace.test(selector[i])) {
                    i++;
                }

                while (i < selectorLength && !whitespace.test(selector[i]) && selector[i] !== ')') {
                    bemElem.push(selector[i]);
                    i++;
                }

                while (i < selectorLength && whitespace.test(selector[i])) {
                    i++;
                }

                if (selector[i] !== ')') {
                    concatizerTokenizeSelectorError(line, i, "Unexpected symbol '" + selector[i] + "'");
                }

                i++;

                if (!bemElem.length) {
                    concatizerTokenizeSelectorError(line, i, 'Empty element name');
                }

                bemElem = bemElem.join('');

                break;

            case '[':
            case '{':
                processAttrMod(selector[i] === '[' ? ']' : '}');
                processToken();
                mods = {};
                val = [];
                what = undefined;
                whatCol = i;

                break;

            default:
                val.push(selector[i]);
                i++;
                break;
        }
    }

    processToken();

    if (!elem) {
        concatizerTokenizeSelectorError(line, 1, 'No tag name');
    }

    if (className.length) {
        attr['class'] = className.join(' ');
    }

    return {elem: elem, attr: attr};
}


function concatizerClearComments(text) {
    var i,
        j,
        k,
        tmp,
        inComment,
        inString;

    i = 0;
    while (i < text.length) {
        tmp = text[i];

        if (!inComment) {
            inString = false;
            j = 0;

            while (j < tmp.length) {
                if (tmp[j] === "'" || tmp[j] === '"') {
                    if (inString === tmp[j] && tmp[j - 1] !== '\\') {
                        inString = false;
                        j++;
                        continue;
                    } else if (!inString) {
                        inString = tmp[j];
                        j++;
                        continue;
                    }
                }

                if (!inString) {
                    if (tmp[j] === '/' && (tmp[j + 1] === '/' || tmp[j + 1] === '*')) {
                        if (tmp[j + 1] === '*') {
                            k = tmp.indexOf('*/');

                            if (k > j) {
                                tmp = tmp.substring(0, j) + Array(k + 3 - j).join(' ') + tmp.substring(k + 2);
                                continue;
                            } else {
                                inComment = true;
                            }
                        }

                        tmp = tmp.substring(0, j);
                        break;
                    }
                }

                j++;
            }

            text[i] = tmp;
        } else { // In comment.
            k = tmp.indexOf('*/');

            if (k >= 0) {
                text[i] = Array(k + 3).join(' ') + tmp.substring(k + 2);
                inComment = false;
                i--;
            } else {
                text[i] = '';
            }
        }

        i++;
    }

    for (i = 0; i < text.length; i++) {
        text[i] = text[i].replace(/\s+$/g, '');
    }
}


function concatizerCompile(text) {
    text = text.split(/\n\r|\r\n|\r|\n/);

    concatizerClearComments(text);
}
