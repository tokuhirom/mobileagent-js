var QUnit = require('../test/qunit').QUnit,
    qunitTap = require('qunit-tap').qunitTap,
    util = require('util'),
    fs = require('fs');

qunitTap(QUnit, util.puts, {noPlan: true});

QUnit.init();
QUnit.config.updateRate = 0;

////////////////////////////////////////

var is = QUnit.equal,
    ok = QUnit.ok,
    subtest = QUnit.test,
    getMobileAgent = require('../mobileagent.js').getMobileAgent
    ;

subtest('docomo', function () {
    var ma = getMobileAgent({
        'user-agent': "DoCoMo/1.0/D501i",
        'x-dcmguid': 'abcdef0',
    });
    ok(ma.is_docomo());
    ok(!ma.is_ezweb());
    ok(!ma.is_softbank());
    ok(!ma.is_airh_phone());
    ok(!ma.is_non_mobile());
    is(ma.getCarrierLongName(), 'DoCoMo');
    is(ma.getUserAgent(), 'DoCoMo/1.0/D501i');
    is(ma.getUserID(), 'abcdef0');
});
subtest('docomo/parse/mova', function () {
    var ma = getMobileAgent({
        'user-agent': "DoCoMo/1.0/D501i",
    });
    is(ma.getModel(), 'D501i');
    is(ma.getBrowserVersion(), '1.0');
});
subtest('docomo/parse/crawller', function () {
    var ma = getMobileAgent({
        'user-agent': "DoCoMo/1.0/P209is (Google CHTML Proxy/1.0)"
    });
    is(ma.getModel(), 'P209is');
    is(ma.getCacheSize(), 5);
    is(ma.getComment(), "Google CHTML Proxy/1.0");
    is(ma.getBrowserVersion(), '1.0');
});
subtest('docomo/parse/mova/D502i', function () {
    var ma = getMobileAgent({
        'user-agent': "DoCoMo/1.0/D502i/c10"
    });
    is(ma.getModel(), 'D502i');
    is(ma.getCacheSize(), '10');
    is(ma.getBrowserVersion(), '1.0');
});
subtest('docomo/parse/foma', function () {
(function () {
    var ma = getMobileAgent({
        'user-agent': "DoCoMo/2.0 N2001(c10;ser0123456789abcde;icc01234567890123456789)",
    });
    is(ma.getModel(), 'N2001');
    is(ma.getCacheSize(), '10');
    is(ma.getDisplayBytes(), undefined);
    is(ma.getBrowserVersion(), '1.0');
})();
(function () {
    var ma = getMobileAgent({
        'user-agent': "DoCoMo/2.0 N06A3(c500;TB;W24H16)",
    });
    is(ma.getDisplayBytes(), '24x16');
    is(ma.getBrowserVersion(), '2.0');
})();
});
subtest('au', function () {
    var ma = getMobileAgent({
        'user-agent': 'UP.Browser/3.01-HI01 UP.Link/3.4.5.2',
        'x-up-subno': 'abcdef0123_45.ezweb.ne.jp'
    });
    ok(!ma.is_docomo());
    ok(ma.is_ezweb());
    ok(!ma.is_softbank());
    ok(!ma.is_airh_phone());
    ok(!ma.is_non_mobile());
    is(ma.getCarrierLongName(), 'EZweb');
    is(ma.getUserID(), 'abcdef0123_45.ezweb.ne.jp');
});
subtest('softbank', function () {
    var ma = getMobileAgent({
        'user-agent': 'J-PHONE/2.0/J-DN02',
        'x-jphone-uid': 'abcdef0123456789'
    });
    ok(!ma.is_docomo());
    ok(!ma.is_ezweb());
    ok(ma.is_softbank());
    ok(!ma.is_airh_phone());
    ok(!ma.is_non_mobile());
    is(ma.getCarrierLongName(), 'SoftBank');
});
subtest('airh_phone', function () {
    var ma = getMobileAgent({'user-agent': 'Mozilla/3.0(DDIPOCKET;JRC/AH-J3001V,AH-J3002V/1.0/0100/c50)CNF/2.0'});
    ok(!ma.is_docomo());
    ok(!ma.is_ezweb());
    ok(!ma.is_softbank());
    ok(ma.is_airh_phone());
    ok(!ma.is_non_mobile());
    is(ma.getCarrierLongName(), 'AirH');
});
subtest('non_mobile', function () {
    var ma = getMobileAgent({'user-agent': 'Mozilla/4.0'});
    ok(!ma.is_docomo());
    ok(!ma.is_ezweb());
    ok(!ma.is_softbank());
    ok(!ma.is_airh_phone());
    ok(ma.is_non_mobile());
    is(ma.getCarrierLongName(), 'NonMobile');
});

////////////////////////////////////////

QUnit.start();

