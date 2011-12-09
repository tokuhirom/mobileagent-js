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

function NoMatchError(ma) {
    this.ma = ma;
}
NoMatchError.prototype = new Error();

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
    getUserID: function () { return this.request['x-dcmguid']; },
    getBrowserVersion: function () {
        return this.isFOMA() && this.getCacheSize() >= 500 ? '2.0' : '1.0';
    },
    parse: function () {
        if (this.parsed) {
            return;
        }
        var ua = this.getUserAgent();
        var x = ua.match(/^([^ ]+) (.+)$/);
        // if ($foma_or_comment && $foma_or_comment =~ s/^\((.*)\)$/$1/) {
        if (x) {
            if (x[2].match(/^\(.*\)$/)) {
                // crawler
                // DoCoMo/1.0/P209is (Google CHTML Proxy/1.0)
                this.comment = x[2].replace(/^\(/, '').replace(/\)$/, '');
                this.parseMain(x[1]);
            } else {
                // foma
                // DoCoMo/2.0 N2001(c10;ser0123456789abcde;icc01234567890123456789)
                this.is_foma = true;
                this.name    = x[1].split('/')[0];
                this.version = x[1].split('/')[0];
                this.parseFoma(x[2]);
            }
        } else {
            // mova
            // DoCoMo/1.0/R692i/c10
            this.parseMain(ua);
        }

        if (!this.cache_size) {
            this.cache_size = 5; // tekitou value.
        }

        this.parsed = true;
    },
    parseMain: function (ua) {
        var parts = ua.split('/');
        this.name = parts[0];
        this.version = parts[1];
        this.model = parts[2];
        if (this.model == 'SH505i2') {
            this.model = 'SH505i';
        }

        var cache = parts[3];
        var self = this;
        if (cache) {
            cache.replace(/^c(.+)/, function (x, y) {
                self.cache_size = y;
            });
            if (!self.cache_size) {
                throw new NoMatchError(this);
            }
        }

        // This is not implemented. Since MOVA will stop at Mar. 2012.
        //  for (@rest) {
        //  /^ser(\w{11})$/  and do { $self->{serial_number} = $1; next };
        //  /^(T[CDBJ])$/    and do { $self->{status} = $1; next };
        //  /^s(\d+)$/       and do { $self->{bandwidth} = $1; next };
        //  /^W(\d+)H(\d+)$/ and do { $self->{display_bytes} = "$1*$2"; next; };
        //  }
    },
    parseFoma: function (foma) {
        // $foma =~ s/^([^\(]+)// or return $self->no_match;
        var self = this;
        foma = foma.replace(/^([^\(]+)/, function (x) {
            self.model = x;
            return '';
        });
        if (!this.model) { throw new NoMatchError(this); }

        foma.replace(/^\((.*?)\)/, function (x, x2) {
            x2.split(/;/).forEach(function (y) {
                var ss = [
                    [/^c(\d+)$/,       function (z) { self.cache_size = z[1] } ],
                    [/^ser(\w{15})$/,  function (z) { self.serial_number = z[1] } ],
                    [/^icc(\w{20})$/,  function (z) { self.card_id = z[1] } ],
                    [/^(T[CDBJ])$/,    function (z) { self.status = z[1] } ],
                    [/^W(\d+)H(\d+)$/, function (z) { self.display_bytes = z[1]+'x'+z[2] } ],
                ];
                for (var i=0, l=ss.length; i<l; i++) {
                    var s = ss[i];
                    var matched = y.match(s[0]);
                    if (matched) {
                        s[1](matched);
                        return;
                    }
                }
                throw new NoMatchError(this);
            });
        });
    }
});
[['getModel', 'model'], ['isFOMA', 'is_foma'], ['getCacheSize', 'cache_size'], ['getDisplayBytes', 'display_bytes'], ['getComment', 'comment']].forEach(function (e) {
    var key = e[1];
    MobileAgentDoCoMo.prototype[e[0]] = function () {
        this.parse();
        return this[key];
    };
});

function MobileAgentSoftBank(req) {
    this.constructor.super_.apply(this, arguments);
}
$E(MobileAgentSoftBank, MobileAgentBase, {
    is_softbank: function () { return true; },
    getCarrier: function () { return 'V'; },
    getCarrierLongName: function () { return 'SoftBank'; },
    getUserID: function () { return this.request['x-jphone-uid']; },
});

function MobileAgentEZWeb(req) {
    this.constructor.super_.apply(this, arguments);
}
$E(MobileAgentEZWeb, MobileAgentBase, {
    is_ezweb: function () { return true; },
    getCarrier: function () { return 'E'; },
    getCarrierLongName: function () { return 'EZweb'; },
    getUserID: function () { return this.request['x-up-subno']; },
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

