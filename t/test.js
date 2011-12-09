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
    var ma = getMobileAgent({'user-agent': "DoCoMo/1.0/D501i"});
    ok(ma.is_docomo());
    ok(!ma.is_ezweb());
    ok(!ma.is_softbank());
    ok(!ma.is_airh_phone());
    ok(!ma.is_non_mobile());
    is(ma.getCarrierLongName(), 'DoCoMo');
    is(ma.getUserAgent(), 'DoCoMo/1.0/D501i');
});
subtest('au', function () {
    var ma = getMobileAgent({'user-agent': 'UP.Browser/3.01-HI01 UP.Link/3.4.5.2'});
    ok(!ma.is_docomo());
    ok(ma.is_ezweb());
    ok(!ma.is_softbank());
    ok(!ma.is_airh_phone());
    ok(!ma.is_non_mobile());
    is(ma.getCarrierLongName(), 'EZweb');
});
subtest('softbank', function () {
    var ma = getMobileAgent({'user-agent': 'J-PHONE/2.0/J-DN02'});
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

