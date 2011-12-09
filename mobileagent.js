"use strict";

var DoCoMoRE = /^DoCoMo\/\d\.\d[ /]/;
var JPhoneRE = /^(?:J-PHONE\/\d\.\d)/i;
var VodafoneRE = /^Vodafone\/\d\.\d/;
var VodafoneMotRE = /^MOT-/;
var SoftBankRE = /^SoftBank\/\d\.\d/;
var SoftBankCrawlerRE = /^Nokia[^/]+\/\d\.\d/;
var EZwebRE  = /^(?:KDDI-[A-Z]+\d+[A-Z]? )?UP\.Browser\//;
var AirHRE = /^Mozilla\/3\.0\((?:WILLCOM|DDIPOCKET)\;/;
function detectCarrier(ua) {
    if (ua.match(DoCoMoRE)) {
        return 'I';
    } else if (ua.match(JPhoneRE)
        || ua.match(VodafoneRE) || ua.match(VodafoneMotRE)
        || ua.match(SoftBankRE) || ua.match(SoftBankCrawlerRE)) {
        return 'V';
    } else if (ua.match(EZwebRE)) {
        return 'E';
    } else if (ua.match(AirHRE)) {
        return 'H';
    } else {
        return 'N';
    }
}

function $E(a, b, c) {
    var k;

    a.super_ = b;
    a.prototype = Object.create(b.prototype, {
        constructor: {
            value: a,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
    for (k in c) {
        if (c.hasOwnProperty(k)) {
            a.prototype[k] = c[k];
        }
    }
}

function MobileAgentBase(req) {
    this.request = req;
}
MobileAgentBase.prototype = {
    is_docomo:     function () { return false; },
    is_ezweb:      function () { return false; },
    is_softbank:   function () { return false; },
    is_airh_phone: function () { return false; },
    is_non_mobile: function () { return false; },

    getUserAgent: function () {
        return this.request['user-agent'];
    }
};

function MobileAgentDoCoMo(req) {
    this.constructor.super_.apply(this, arguments);
}
$E(MobileAgentDoCoMo, MobileAgentBase, {
    is_docomo: function () { return true; },
    getCarrier: function () { return 'I'; },
    getCarrierLongName: function () { return 'DoCoMo'; },
});

function MobileAgentSoftBank(req) {
    this.constructor.super_.apply(this, arguments);
}
$E(MobileAgentSoftBank, MobileAgentBase, {
    is_softbank: function () { return true; },
    getCarrier: function () { return 'V'; },
    getCarrierLongName: function () { return 'SoftBank'; },
});

function MobileAgentEZWeb(req) {
    this.constructor.super_.apply(this, arguments);
}
$E(MobileAgentEZWeb, MobileAgentBase, {
    is_ezweb: function () { return true; },
    getCarrier: function () { return 'E'; },
    getCarrierLongName: function () { return 'EZweb'; },
});

function MobileAgentAirHPhone(req) {
    this.constructor.super_.apply(this, arguments);
}
$E(MobileAgentAirHPhone, MobileAgentBase, {
    is_airh_phone: function () { return true; },
    getCarrier: function () { return 'H'; },
    getCarrierLongName: function () { return 'AirH'; },
});

function MobileAgentNonMobile(req) {
    this.constructor.super_.apply(this, arguments);
}
$E(MobileAgentNonMobile, MobileAgentBase, {
    is_non_mobile: function () { return true; },
    getCarrier: function () { return 'N'; },
    getCarrierLongName: function () { return 'NonMobile'; },
});

function getMobileAgent(req) {
    var ua = req['user-agent'],
        carrier = detectCarrier(ua);
    switch (carrier) {
    case 'I':
        return new MobileAgentDoCoMo(req);
    case 'V':
        return new MobileAgentSoftBank(req);
    case 'E':
        return new MobileAgentEZWeb(req);
    case 'H':
        return new MobileAgentAirHPhone(req);
    default:
        return new MobileAgentNonMobile(req);
    }
}

// export functions
exports.getMobileAgent = getMobileAgent;
exports.detectCarrier = detectCarrier;

