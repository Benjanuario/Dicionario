
// We are modularizing this manually because the current modularize setting in Emscripten has some issues:
// https://github.com/kripken/emscripten/issues/5820
// In addition, When you use emcc's modularization, it still expects to export a global object called `Module`,
// which is able to be used/called before the WASM is loaded.
// The modularization below exports a promise that loads and resolves to the actual sql.js module.
// That way, this module can't be used before the WASM is finished loading.

// We are going to define a function that a user will call to start loading initializing our Sql.js library
// However, that function might be called multiple times, and on subsequent calls, we don't actually want it to instantiate a new instance of the Module
// Instead, we want to return the previously loaded module

// TODO: Make this not declare a global if used in the browser
var initSqlJsPromise = undefined;

var initSqlJs = function (moduleConfig) {

    if (initSqlJsPromise){
      return initSqlJsPromise;
    }
    // If we're here, we've never called this function before
    initSqlJsPromise = new Promise(function (resolveModule, reject) {

        // We are modularizing this manually because the current modularize setting in Emscripten has some issues:
        // https://github.com/kripken/emscripten/issues/5820

        // The way to affect the loading of emcc compiled modules is to create a variable called `Module` and add
        // properties to it, like `preRun`, `postRun`, etc
        // We are using that to get notified when the WASM has finished loading.
        // Only then will we return our promise

        // If they passed in a moduleConfig object, use that
        // Otherwise, initialize Module to the empty object
        var Module = typeof moduleConfig !== 'undefined' ? moduleConfig : {};

        // EMCC only allows for a single onAbort function (not an array of functions)
        // So if the user defined their own onAbort function, we remember it and call it
        var originalOnAbortFunction = Module['onAbort'];
        Module['onAbort'] = function (errorThatCausedAbort) {
            reject(new Error(errorThatCausedAbort));
            if (originalOnAbortFunction){
              originalOnAbortFunction(errorThatCausedAbort);
            }
        };

        Module['postRun'] = Module['postRun'] || [];
        Module['postRun'].push(function () {
            // When Emscripted calls postRun, this promise resolves with the built Module
            resolveModule(Module);
        });

        // There is a section of code in the emcc-generated code below that looks like this:
        // (Note that this is lowercase `module`)
        // if (typeof module !== 'undefined') {
        //     module['exports'] = Module;
        // }
        // When that runs, it's going to overwrite our own modularization export efforts in shell-post.js!
        // The only way to tell emcc not to emit it is to pass the MODULARIZE=1 or MODULARIZE_INSTANCE=1 flags,
        // but that carries with it additional unnecessary baggage/bugs we don't want either.
        // So, we have three options:
        // 1) We undefine `module`
        // 2) We remember what `module['exports']` was at the beginning of this function and we restore it later
        // 3) We write a script to remove those lines of code as part of the Make process.
        //
        // Since those are the only lines of code that care about module, we will undefine it. It's the most straightforward
        // of the options, and has the side effect of reducing emcc's efforts to modify the module if its output were to change in the future.
        // That's a nice side effect since we're handling the modularization efforts ourselves
        module = undefined;

        // The emcc-generated code and shell-post.js code goes below,
        // meaning that all of it runs inside of this promise. If anything throws an exception, our promise will abort
var f;f||=typeof Module !== 'undefined' ? Module : {};"use strict";
f.onRuntimeInitialized=function(){function a(g,l){switch(typeof l){case "boolean":mc(g,l?1:0);break;case "number":nc(g,l);break;case "string":oc(g,l,-1,-1);break;case "object":if(null===l)lb(g);else if(null!=l.length){var n=aa(l,ba);pc(g,n,l.length,-1);ca(n)}else Aa(g,"Wrong API use : tried to return a value of an unknown type ("+l+").",-1);break;default:lb(g)}}function b(g,l){for(var n=[],t=0;t<g;t+=1){var w=m(l+4*t,"i32"),z=qc(w);if(1===z||2===z)w=rc(w);else if(3===z)w=sc(w);else if(4===z){z=w;
w=tc(z);z=uc(z);for(var N=new Uint8Array(w),L=0;L<w;L+=1)N[L]=p[z+L];w=N}else w=null;n.push(w)}return n}function c(g,l){this.La=g;this.db=l;this.Ja=1;this.fb=[]}function d(g,l){this.db=l;l=da(g)+1;this.Ya=ea(l);if(null===this.Ya)throw Error("Unable to allocate memory for the SQL string");fa(g,q,this.Ya,l);this.eb=this.Ya;this.Ua=this.ib=null}function e(g){this.filename="dbfile_"+(4294967295*Math.random()>>>0);if(null!=g){var l=this.filename,n="/",t=l;n&&(n="string"==typeof n?n:ha(n),t=l?u(n+"/"+l):
n);l=ia(!0,!0);t=ja(t,(void 0!==l?l:438)&4095|32768,0);if(g){if("string"==typeof g){n=Array(g.length);for(var w=0,z=g.length;w<z;++w)n[w]=g.charCodeAt(w);g=n}ka(t,l|146);n=la(t,577);ma(n,g,0,g.length,0);na(n);ka(t,l)}}this.handleError(r(this.filename,h));this.db=m(h,"i32");ob(this.db);this.Za={};this.Na={}}var h=x(4),k=f.cwrap,r=k("sqlite3_open","number",["string","number"]),y=k("sqlite3_close_v2","number",["number"]),v=k("sqlite3_exec","number",["number","string","number","number","number"]),F=k("sqlite3_changes",
"number",["number"]),H=k("sqlite3_prepare_v2","number",["number","string","number","number","number"]),pb=k("sqlite3_sql","string",["number"]),vc=k("sqlite3_normalized_sql","string",["number"]),qb=k("sqlite3_prepare_v2","number",["number","number","number","number","number"]),wc=k("sqlite3_bind_text","number",["number","number","number","number","number"]),rb=k("sqlite3_bind_blob","number",["number","number","number","number","number"]),xc=k("sqlite3_bind_double","number",["number","number","number"]),
yc=k("sqlite3_bind_int","number",["number","number","number"]),zc=k("sqlite3_bind_parameter_index","number",["number","string"]),Ac=k("sqlite3_step","number",["number"]),Bc=k("sqlite3_errmsg","string",["number"]),Cc=k("sqlite3_column_count","number",["number"]),Dc=k("sqlite3_data_count","number",["number"]),Ec=k("sqlite3_column_double","number",["number","number"]),sb=k("sqlite3_column_text","string",["number","number"]),Fc=k("sqlite3_column_blob","number",["number","number"]),Gc=k("sqlite3_column_bytes",
"number",["number","number"]),Hc=k("sqlite3_column_type","number",["number","number"]),Ic=k("sqlite3_column_name","string",["number","number"]),Jc=k("sqlite3_reset","number",["number"]),Kc=k("sqlite3_clear_bindings","number",["number"]),Lc=k("sqlite3_finalize","number",["number"]),tb=k("sqlite3_create_function_v2","number","number string number number number number number number number".split(" ")),qc=k("sqlite3_value_type","number",["number"]),tc=k("sqlite3_value_bytes","number",["number"]),sc=k("sqlite3_value_text",
"string",["number"]),uc=k("sqlite3_value_blob","number",["number"]),rc=k("sqlite3_value_double","number",["number"]),nc=k("sqlite3_result_double","",["number","number"]),lb=k("sqlite3_result_null","",["number"]),oc=k("sqlite3_result_text","",["number","string","number","number"]),pc=k("sqlite3_result_blob","",["number","number","number","number"]),mc=k("sqlite3_result_int","",["number","number"]),Aa=k("sqlite3_result_error","",["number","string","number"]),ub=k("sqlite3_aggregate_context","number",
["number","number"]),ob=k("RegisterExtensionFunctions","number",["number"]);c.prototype.bind=function(g){if(!this.La)throw"Statement closed";this.reset();return Array.isArray(g)?this.wb(g):null!=g&&"object"===typeof g?this.xb(g):!0};c.prototype.step=function(){if(!this.La)throw"Statement closed";this.Ja=1;var g=Ac(this.La);switch(g){case 100:return!0;case 101:return!1;default:throw this.db.handleError(g);}};c.prototype.rb=function(g){null==g&&(g=this.Ja,this.Ja+=1);return Ec(this.La,g)};c.prototype.Ab=
function(g){null==g&&(g=this.Ja,this.Ja+=1);g=sb(this.La,g);if("function"!==typeof BigInt)throw Error("BigInt is not supported");return BigInt(g)};c.prototype.Bb=function(g){null==g&&(g=this.Ja,this.Ja+=1);return sb(this.La,g)};c.prototype.getBlob=function(g){null==g&&(g=this.Ja,this.Ja+=1);var l=Gc(this.La,g);g=Fc(this.La,g);for(var n=new Uint8Array(l),t=0;t<l;t+=1)n[t]=p[g+t];return n};c.prototype.get=function(g,l){l=l||{};null!=g&&this.bind(g)&&this.step();g=[];for(var n=Dc(this.La),t=0;t<n;t+=
1)switch(Hc(this.La,t)){case 1:var w=l.useBigInt?this.Ab(t):this.rb(t);g.push(w);break;case 2:g.push(this.rb(t));break;case 3:g.push(this.Bb(t));break;case 4:g.push(this.getBlob(t));break;default:g.push(null)}return g};c.prototype.getColumnNames=function(){for(var g=[],l=Cc(this.La),n=0;n<l;n+=1)g.push(Ic(this.La,n));return g};c.prototype.getAsObject=function(g,l){g=this.get(g,l);l=this.getColumnNames();for(var n={},t=0;t<l.length;t+=1)n[l[t]]=g[t];return n};c.prototype.getSQL=function(){return pb(this.La)};
c.prototype.getNormalizedSQL=function(){return vc(this.La)};c.prototype.run=function(g){null!=g&&this.bind(g);this.step();return this.reset()};c.prototype.nb=function(g,l){null==l&&(l=this.Ja,this.Ja+=1);g=oa(g);var n=aa(g,ba);this.fb.push(n);this.db.handleError(wc(this.La,l,n,g.length-1,0))};c.prototype.vb=function(g,l){null==l&&(l=this.Ja,this.Ja+=1);var n=aa(g,ba);this.fb.push(n);this.db.handleError(rb(this.La,l,n,g.length,0))};c.prototype.mb=function(g,l){null==l&&(l=this.Ja,this.Ja+=1);this.db.handleError((g===
(g|0)?yc:xc)(this.La,l,g))};c.prototype.yb=function(g){null==g&&(g=this.Ja,this.Ja+=1);rb(this.La,g,0,0,0)};c.prototype.ob=function(g,l){null==l&&(l=this.Ja,this.Ja+=1);switch(typeof g){case "string":this.nb(g,l);return;case "number":this.mb(g,l);return;case "bigint":this.nb(g.toString(),l);return;case "boolean":this.mb(g+0,l);return;case "object":if(null===g){this.yb(l);return}if(null!=g.length){this.vb(g,l);return}}throw"Wrong API use : tried to bind a value of an unknown type ("+g+").";};c.prototype.xb=
function(g){var l=this;Object.keys(g).forEach(function(n){var t=zc(l.La,n);0!==t&&l.ob(g[n],t)});return!0};c.prototype.wb=function(g){for(var l=0;l<g.length;l+=1)this.ob(g[l],l+1);return!0};c.prototype.reset=function(){this.freemem();return 0===Kc(this.La)&&0===Jc(this.La)};c.prototype.freemem=function(){for(var g;void 0!==(g=this.fb.pop());)ca(g)};c.prototype.free=function(){this.freemem();var g=0===Lc(this.La);delete this.db.Za[this.La];this.La=0;return g};d.prototype.next=function(){if(null===
this.Ya)return{done:!0};null!==this.Ua&&(this.Ua.free(),this.Ua=null);if(!this.db.db)throw this.gb(),Error("Database closed");var g=pa(),l=x(4);qa(h);qa(l);try{this.db.handleError(qb(this.db.db,this.eb,-1,h,l));this.eb=m(l,"i32");var n=m(h,"i32");if(0===n)return this.gb(),{done:!0};this.Ua=new c(n,this.db);this.db.Za[n]=this.Ua;return{value:this.Ua,done:!1}}catch(t){throw this.ib=ra(this.eb),this.gb(),t;}finally{sa(g)}};d.prototype.gb=function(){ca(this.Ya);this.Ya=null};d.prototype.getRemainingSQL=
function(){return null!==this.ib?this.ib:ra(this.eb)};"function"===typeof Symbol&&"symbol"===typeof Symbol.iterator&&(d.prototype[Symbol.iterator]=function(){return this});e.prototype.run=function(g,l){if(!this.db)throw"Database closed";if(l){g=this.prepare(g,l);try{g.step()}finally{g.free()}}else this.handleError(v(this.db,g,0,0,h));return this};e.prototype.exec=function(g,l,n){if(!this.db)throw"Database closed";var t=pa(),w=null;try{var z=ta(g),N=x(4);for(g=[];0!==m(z,"i8");){qa(h);qa(N);this.handleError(qb(this.db,
z,-1,h,N));var L=m(h,"i32");z=m(N,"i32");if(0!==L){var K=null;w=new c(L,this);for(null!=l&&w.bind(l);w.step();)null===K&&(K={columns:w.getColumnNames(),values:[]},g.push(K)),K.values.push(w.get(null,n));w.free()}}return g}catch(O){throw w&&w.free(),O;}finally{sa(t)}};e.prototype.each=function(g,l,n,t,w){"function"===typeof l&&(t=n,n=l,l=void 0);g=this.prepare(g,l);try{for(;g.step();)n(g.getAsObject(null,w))}finally{g.free()}if("function"===typeof t)return t()};e.prototype.prepare=function(g,l){qa(h);
this.handleError(H(this.db,g,-1,h,0));g=m(h,"i32");if(0===g)throw"Nothing to prepare";var n=new c(g,this);null!=l&&n.bind(l);return this.Za[g]=n};e.prototype.iterateStatements=function(g){return new d(g,this)};e.prototype["export"]=function(){Object.values(this.Za).forEach(function(l){l.free()});Object.values(this.Na).forEach(ua);this.Na={};this.handleError(y(this.db));var g=va(this.filename);this.handleError(r(this.filename,h));this.db=m(h,"i32");ob(this.db);return g};e.prototype.close=function(){null!==
this.db&&(Object.values(this.Za).forEach(function(g){g.free()}),Object.values(this.Na).forEach(ua),this.Na={},this.handleError(y(this.db)),wa("/"+this.filename),this.db=null)};e.prototype.handleError=function(g){if(0===g)return null;g=Bc(this.db);throw Error(g);};e.prototype.getRowsModified=function(){return F(this.db)};e.prototype.create_function=function(g,l){Object.prototype.hasOwnProperty.call(this.Na,g)&&(ua(this.Na[g]),delete this.Na[g]);var n=xa(function(t,w,z){w=b(w,z);try{var N=l.apply(null,
w)}catch(L){Aa(t,L,-1);return}a(t,N)},"viii");this.Na[g]=n;this.handleError(tb(this.db,g,l.length,1,0,n,0,0,0));return this};e.prototype.create_aggregate=function(g,l){var n=l.init||function(){return null},t=l.finalize||function(K){return K},w=l.step;if(!w)throw"An aggregate function must have a step function in "+g;var z={};Object.hasOwnProperty.call(this.Na,g)&&(ua(this.Na[g]),delete this.Na[g]);l=g+"__finalize";Object.hasOwnProperty.call(this.Na,l)&&(ua(this.Na[l]),delete this.Na[l]);var N=xa(function(K,
O,Ua){var X=ub(K,1);Object.hasOwnProperty.call(z,X)||(z[X]=n());O=b(O,Ua);O=[z[X]].concat(O);try{z[X]=w.apply(null,O)}catch(Nc){delete z[X],Aa(K,Nc,-1)}},"viii"),L=xa(function(K){var O=ub(K,1);try{var Ua=t(z[O])}catch(X){delete z[O];Aa(K,X,-1);return}a(K,Ua);delete z[O]},"vi");this.Na[g]=N;this.Na[l]=L;this.handleError(tb(this.db,g,w.length-1,1,0,0,N,L,0));return this};f.Database=e};
var ya=Object.assign({},f),za="./this.program",Ba="object"==typeof window,Ca="function"==typeof importScripts,Da="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node,A="",Ea,Fa,Ga;
if(Da){var fs=require("fs"),Ha=require("path");A=Ca?Ha.dirname(A)+"/":__dirname+"/";Ea=(a,b)=>{a=Ia(a)?new URL(a):Ha.normalize(a);return fs.readFileSync(a,b?void 0:"utf8")};Ga=a=>{a=Ea(a,!0);a.buffer||(a=new Uint8Array(a));return a};Fa=(a,b,c,d=!0)=>{a=Ia(a)?new URL(a):Ha.normalize(a);fs.readFile(a,d?void 0:"utf8",(e,h)=>{e?c(e):b(d?h.buffer:h)})};!f.thisProgram&&1<process.argv.length&&(za=process.argv[1].replace(/\\/g,"/"));process.argv.slice(2);"undefined"!=typeof module&&(module.exports=f);f.inspect=
()=>"[Emscripten Module object]"}else if(Ba||Ca)Ca?A=self.location.href:"undefined"!=typeof document&&document.currentScript&&(A=document.currentScript.src),A=0!==A.indexOf("blob:")?A.substr(0,A.replace(/[?#].*/,"").lastIndexOf("/")+1):"",Ea=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.send(null);return b.responseText},Ca&&(Ga=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)}),Fa=(a,b,c)=>{var d=new XMLHttpRequest;d.open("GET",
a,!0);d.responseType="arraybuffer";d.onload=()=>{200==d.status||0==d.status&&d.response?b(d.response):c()};d.onerror=c;d.send(null)};var Ja=f.print||console.log.bind(console),B=f.printErr||console.error.bind(console);Object.assign(f,ya);ya=null;f.thisProgram&&(za=f.thisProgram);var Ka;f.wasmBinary&&(Ka=f.wasmBinary);"object"!=typeof WebAssembly&&C("no native wasm support detected");var La,Ma=!1,p,q,Na,D,E,Oa,Pa;
function Qa(){var a=La.buffer;f.HEAP8=p=new Int8Array(a);f.HEAP16=Na=new Int16Array(a);f.HEAPU8=q=new Uint8Array(a);f.HEAPU16=new Uint16Array(a);f.HEAP32=D=new Int32Array(a);f.HEAPU32=E=new Uint32Array(a);f.HEAPF32=Oa=new Float32Array(a);f.HEAPF64=Pa=new Float64Array(a)}var Ra=[],Sa=[],Ta=[];function Va(){var a=f.preRun.shift();Ra.unshift(a)}var G=0,Wa=null,Xa=null;
function C(a){f.onAbort?.(a);a="Aborted("+a+")";B(a);Ma=!0;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}var Ya=a=>a.startsWith("data:application/octet-stream;base64,"),Ia=a=>a.startsWith("file://"),Za;Za="sql-wasm.wasm";if(!Ya(Za)){var $a=Za;Za=f.locateFile?f.locateFile($a,A):A+$a}function ab(a){if(a==Za&&Ka)return new Uint8Array(Ka);if(Ga)return Ga(a);throw"both async and sync fetching of the wasm failed";}
function bb(a){if(!Ka&&(Ba||Ca)){if("function"==typeof fetch&&!Ia(a))return fetch(a,{credentials:"same-origin"}).then(b=>{if(!b.ok)throw"failed to load wasm binary file at '"+a+"'";return b.arrayBuffer()}).catch(()=>ab(a));if(Fa)return new Promise((b,c)=>{Fa(a,d=>b(new Uint8Array(d)),c)})}return Promise.resolve().then(()=>ab(a))}function cb(a,b,c){return bb(a).then(d=>WebAssembly.instantiate(d,b)).then(d=>d).then(c,d=>{B(`failed to asynchronously prepare wasm: ${d}`);C(d)})}
function db(a,b){var c=Za;Ka||"function"!=typeof WebAssembly.instantiateStreaming||Ya(c)||Ia(c)||Da||"function"!=typeof fetch?cb(c,a,b):fetch(c,{credentials:"same-origin"}).then(d=>WebAssembly.instantiateStreaming(d,a).then(b,function(e){B(`wasm streaming compile failed: ${e}`);B("falling back to ArrayBuffer instantiation");return cb(c,a,b)}))}var I,J,eb=a=>{for(;0<a.length;)a.shift()(f)};
function m(a,b="i8"){b.endsWith("*")&&(b="*");switch(b){case "i1":return p[a>>0];case "i8":return p[a>>0];case "i16":return Na[a>>1];case "i32":return D[a>>2];case "i64":C("to do getValue(i64) use WASM_BIGINT");case "float":return Oa[a>>2];case "double":return Pa[a>>3];case "*":return E[a>>2];default:C(`invalid type for getValue: ${b}`)}}
function qa(a){var b="i32";b.endsWith("*")&&(b="*");switch(b){case "i1":p[a>>0]=0;break;case "i8":p[a>>0]=0;break;case "i16":Na[a>>1]=0;break;case "i32":D[a>>2]=0;break;case "i64":C("to do setValue(i64) use WASM_BIGINT");case "float":Oa[a>>2]=0;break;case "double":Pa[a>>3]=0;break;case "*":E[a>>2]=0;break;default:C(`invalid type for setValue: ${b}`)}}
var fb="undefined"!=typeof TextDecoder?new TextDecoder("utf8"):void 0,M=(a,b,c)=>{var d=b+c;for(c=b;a[c]&&!(c>=d);)++c;if(16<c-b&&a.buffer&&fb)return fb.decode(a.subarray(b,c));for(d="";b<c;){var e=a[b++];if(e&128){var h=a[b++]&63;if(192==(e&224))d+=String.fromCharCode((e&31)<<6|h);else{var k=a[b++]&63;e=224==(e&240)?(e&15)<<12|h<<6|k:(e&7)<<18|h<<12|k<<6|a[b++]&63;65536>e?d+=String.fromCharCode(e):(e-=65536,d+=String.fromCharCode(55296|e>>10,56320|e&1023))}}else d+=String.fromCharCode(e)}return d},
ra=(a,b)=>a?M(q,a,b):"",gb=(a,b)=>{for(var c=0,d=a.length-1;0<=d;d--){var e=a[d];"."===e?a.splice(d,1):".."===e?(a.splice(d,1),c++):c&&(a.splice(d,1),c--)}if(b)for(;c;c--)a.unshift("..");return a},u=a=>{var b="/"===a.charAt(0),c="/"===a.substr(-1);(a=gb(a.split("/").filter(d=>!!d),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a},hb=a=>{var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);a=b[0];b=b[1];if(!a&&!b)return".";b&&=b.substr(0,b.length-1);return a+
b},ib=a=>{if("/"===a)return"/";a=u(a);a=a.replace(/\/$/,"");var b=a.lastIndexOf("/");return-1===b?a:a.substr(b+1)},jb=()=>{if("object"==typeof crypto&&"function"==typeof crypto.getRandomValues)return c=>crypto.getRandomValues(c);if(Da)try{var a=require("crypto");if(a.randomFillSync)return c=>a.randomFillSync(c);var b=a.randomBytes;return c=>(c.set(b(c.byteLength)),c)}catch(c){}C("initRandomDevice")},kb=a=>(kb=jb())(a);
function mb(){for(var a="",b=!1,c=arguments.length-1;-1<=c&&!b;c--){b=0<=c?arguments[c]:"/";if("string"!=typeof b)throw new TypeError("Arguments to path.resolve must be strings");if(!b)return"";a=b+"/"+a;b="/"===b.charAt(0)}a=gb(a.split("/").filter(d=>!!d),!b).join("/");return(b?"/":"")+a||"."}
var nb=[],da=a=>{for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c)
