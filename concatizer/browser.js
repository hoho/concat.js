function concatizerCompileScriptTags() {
    var i,
        tpls = document.getElementsByTagName('script'),
        tpl;

    for (i = 0; i < tpls.length; i++) {
        tpl = tpls[i];
        if (tpl.getAttribute('type') === 'concat.js/template') {
            concatizerCompile(tpl.innerHTML);
        }
    }
}
