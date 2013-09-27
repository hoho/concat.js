function concatizerCompileScriptTags() {
    var i,
        tpls = document.getElementsByTagName('script'),
        tpl,
        compiled,
        name;

    if (!$C.tpl) {
        $C.tpl = {};
    }

    for (i = 0; i < tpls.length; i++) {
        tpl = tpls[i];
        if (tpl.getAttribute('type') === 'concat.js/template') {
            compiled = concatizerCompile(tpl.innerHTML);

            for (name in compiled) {
                eval('$C.tpl[name] = ' + compiled[name]);
            }
        }
    }
}

concatizerCompileScriptTags();
