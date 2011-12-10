var QUnit = require('../test/qunit').QUnit,
    qunitTap = require('qunit-tap').qunitTap,
    util = require('util'),
    fs = require('fs');

qunitTap(QUnit, util.puts, {noPlan: true});

QUnit.init();
QUnit.config.updateRate = 0;

////////////////////////////////////////

var is = QUnit.equal,
    is_deeply = QUnit.deepEqual,
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
subtest('docomo/parse/mova/F671iS', function () {
    var ma = getMobileAgent({
        'user-agent': "DoCoMo/1.0/F671iS/c10/TB"
    });
    is(ma.getModel(), 'F671iS');
    is(ma.getCacheSize(), '10');
    is(ma.getBrowserVersion(), '1.0');
    is(ma.getStatus(), 'TB');
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
    is(ma.getDisplayBytes(), '24*16');
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
subtest('au/win', function () {
    var ma = getMobileAgent({
        'user-agent': 'KDDI-TS21 UP.Browser/6.0.2.276 (GUI) MMP/1.1',
    });
    is(ma.getDeviceID(), 'TS21');
    is(ma.getVersion(), '6.0.2.276 (GUI)');
    is(ma.getServer(), 'MMP/1.1');
    is(ma.getName(), 'UP.Browser');
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
subtest('softbank/3gc/vodafone', function () {
    var ma = getMobileAgent({
        'user-agent': 'Vodafone/1.0/V802SE/SEJ001 Browser/SEMC-Browser/4.1 Profile/MIDP-2.0 Configuration/CLDC-1.1',
        'x-jphone-uid': 'abcdef0123456789'
    });
    is(ma.getName(), 'Vodafone');
    is(ma.getVersion(), '1.0');
    is(ma.getModel(), 'V802SE');
    is(ma.isType3GC(), true);
    is_deeply(ma.getJavaInfo(), {Profile: 'MIDP-2.0', 'Configuration': 'CLDC-1.1'});
});
subtest('softbank/3gc/softbank', function () {
    var ma = getMobileAgent({
        'user-agent': 'SoftBank/1.0/910T/TJ001 Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1',
        'x-jphone-uid': 'abcdef0123456789'
    });
    is(ma.getName(), 'SoftBank');
    is(ma.getVersion(), '1.0');
    is(ma.getModel(), '910T');
    is(ma.isType3GC(), true);
});
subtest('softbank/3gc/motrola', function () {
    var ma = getMobileAgent({
        'user-agent': 'MOT-V980/80.2B.04I MIB/2.2.1 Profile/MIDP-2.0 Configuration/CLDC-1.1',
        'x-jphone-uid': 'abcdef0123456789'
    });
    is(ma.getName(), 'MOT-V980');
    is(ma.getVersion(), undefined);
    is(ma.getModel(), 'V702MO');
    is(ma.isType3GC(), true);
    is_deeply(ma.getJavaInfo(), {Profile: 'MIDP-2.0', 'Configuration': 'CLDC-1.1'});
});
subtest('softbank/3gc/crawler', function () {
    var ma = getMobileAgent({
        'user-agent': 'Nokia6820/2.0 (4.83) Profile/MIDP-1.0 Configuration/CLDC-1.0',
        'x-jphone-uid': 'abcdef0123456789'
    });
    is(ma.getName(), 'Vodafone');
    is(ma.getVersion(), undefined);
    is(ma.getModel(), 'Nokia6820');
    is(ma.isType3GC(), true);
    is_deeply(ma.getJavaInfo(), {Profile: 'MIDP-1.0', 'Configuration': 'CLDC-1.0'});
});
subtest('softbank/jphone/new', function () {
    var ma = getMobileAgent({
        'user-agent': 'J-PHONE/4.0/J-SH51/SNJSHA3029293 SH/0001aa Profile/MIDP-1.0 Configuration/CLDC-1.0 Ext-Profile/JSCL-1.1.0',
        'x-jphone-uid': 'abcdef0123456789'
    });
    is(ma.getName(), 'J-PHONE');
    is(ma.getVersion(), '4.0');
    is(ma.getModel(), 'J-SH51');
    is(ma.getSerialNumber(), 'SNJSHA3029293');
    is(ma.isType3GC(), false);
    is_deeply(ma.getJavaInfo(), {Profile: 'MIDP-1.0', 'Configuration': 'CLDC-1.0', 'Ext-Profile': 'JSCL-1.1.0'});
});
subtest('softbank/jphone/old', function () {
    var ma = getMobileAgent({
        'user-agent': 'J-PHONE/2.0/J-DN02',
        'x-jphone-uid': 'abcdef0123456789'
    });
    is(ma.getName(), 'J-PHONE');
    is(ma.getVersion(), '2.0');
    is(ma.getModel(), 'J-DN02');
    is(ma.isType3GC(), false);
});
subtest('softbank/jphone/types', function () {
    [
        ['J-PHONE/2.0/J-DN02', 'C2'],
        ['J-PHONE/3.0/J-T07', 'C3'],
        ['J-PHONE/4.0/J-K51/SNJKWA3001061 KW/1.00 Profile/MIDP-1.0 Configuration/CLDC-1.0 Ext-Profile/JSCL-1.1.0', 'P4'],
        ['J-PHONE/4.2/J-SH53_a/SNJSHF1082264 SH/0003aa Profile/MIDP-1.0 Configuration/CLDC-1.0 Ext-Profile/JSCL-1.2.1', 'P5'],
        ['J-PHONE/4.3/V602SH SH/0006aa Profile/MIDP-1.0 Configuration/CLDC-1.0 Ext-Profile/JSCL-1.2.2', 'P6'],
        // I cannot found P7 type phone's UA.
        ['J-PHONE/5.0/V801SA', 'W'],
        ['J-Phone/5.0/J-SH03 (compatible; Mozilla 4.0; MSIE 5.5; YahooSeeker)', 'W'],
    ].forEach(function (x) {
        var ua = x[0];
        var type = x[1];
        var ma = getMobileAgent({
            'user-agent': ua,
        });
        is(ma.getType(), type, type);
    });
});
subtest('softbank/jphone/YahooSeeker', function () {
    var ma = getMobileAgent({
        'user-agent': 'J-Phone/5.0/J-SH03 (compatible; Mozilla 4.0; MSIE 5.5; YahooSeeker)',
        'x-jphone-uid': 'abcdef0123456789'
    });
    is(ma.getName(), 'J-PHONE');
    is(ma.getVersion(), '5.0');
    is(ma.getModel(), 'J-SH03');
    is(ma.isType3GC(), false);
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

