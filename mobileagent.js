(function () {

"use strict";

var global = this;

var DoCoMoRE = /^DoCoMo\/\d\.\d[ \/]/;
var JPhoneRE = /^(?:J-PHONE\/\d\.\d)/i;
var VodafoneRE = /^Vodafone\/\d\.\d/;
var VodafoneMotRE = /^MOT-/;
var SoftBankRE = /^SoftBank\/\d\.\d/;
var SoftBankCrawlerRE = /^Nokia[^\/]+\/\d\.\d/;
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

function $E(a, b, c, d) {
    var k, m;

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
    if (d) {
        for (m in d) {
            if (d.hasOwnProperty(m)) {
                (function (m) {
                    a.prototype[m] = function () {
                        this._parse();
                        return this[d[m]];
                    };
                })(m);
            }
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
    _parse: function () {
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
                this._parseMain(x[1]);
            } else {
                // foma
                // DoCoMo/2.0 N2001(c10;ser0123456789abcde;icc01234567890123456789)
                this.is_foma = true;
                this.name    = x[1].split('/')[0];
                this.version = x[1].split('/')[0];
                this._parseFoma(x[2]);
            }
        } else {
            // mova
            // DoCoMo/1.0/R692i/c10
            this._parseMain(ua);
        }

        if (!this.cache_size) {
            this.cache_size = 5; // tekitou value.
        }

        this.parsed = true;
    },
    _parseMain: function (ua) {
        var parts = ua.split('/'),
            self = this;
        this.name = parts[0];
        this.version = parts[1];
        this.model = parts[2];
        if (this.model === 'SH505i2') {
            this.model = 'SH505i';
        }

        (function (cache) {
            if (cache) {
                cache.replace(/^c(.+)/, function (x, y) {
                    self.cache_size = y;
                });
                if (!self.cache_size) {
                    throw new NoMatchError(this);
                }
            }
            })(parts[3]);
        parts.slice(4).forEach(function (y) {
            var ss = [
                [/^ser(\w{11})$/,  function (z) { self.serial_number = z[1]; } ],
                [/^(T[CDBJ])$/,    function (z) { self.status = z[1]; } ],
                [/^s(\d+)$/,       function (z) { self.serial_number = z[1]; } ],
                [/^W(\d+)H(\d+)$/, function (z) { self.display_bytes = z[1]+'*'+z[2]; } ],
            ];
            for (var i=0, l=ss.length; i<l; i++) {
                var s = ss[i];
                var matched = y.match(s[0]);
                if (matched) {
                    s[1](matched);
                    return;
                }
            }
        });
    },
    _parseFoma: function (foma) {
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
                    [/^c(\d+)$/,       function (z) { self.cache_size = z[1]; } ],
                    [/^ser(\w{15})$/,  function (z) { self.serial_number = z[1]; } ],
                    [/^icc(\w{20})$/,  function (z) { self.card_id = z[1]; } ],
                    [/^(T[CDBJ])$/,    function (z) { self.status = z[1]; } ],
                    [/^W(\d+)H(\d+)$/, function (z) { self.display_bytes = z[1]+'*'+z[2]; } ],
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
}, {
    getModel: 'model',
    isFOMA: 'is_foma',
    getCacheSize: 'cache_size',
    getDisplayBytes: 'display_bytes',
    getComment: 'comment',
    getStatus: 'status',
});

function MobileAgentSoftBank(req) {
    this.constructor.super_.apply(this, arguments);
}
$E(MobileAgentSoftBank, MobileAgentBase, {
    is_softbank: function () { return true; },
    getCarrier: function () { return 'V'; },
    getCarrierLongName: function () { return 'SoftBank'; },
    getUserID: function () { return this.request['x-jphone-uid']; },
    isType3GC: function () {
        return this.type === '3GC';
    },
    _parse: function () {
        if (this.parsed) {
            return;
        }

        var ua = this.getUserAgent();
        if (ua.match(/^Vodafone/)) {
            this._parseVodafone3GC(ua);
        } else if (ua.match(/^SoftBank/)) {
            this._parseSoftbank3GC(ua);
        } else if (ua.match(/^MOT-/)) {
            this._parseMotrola3GC(ua);
        } else if (ua.match(/^Nokia/)) {
            this._parseCrawler3GC(ua); // ad-hoc
        } else { // old j-phone
            this._parseJPhone(ua);
        }

        this.parsed = true;
    },
    _parseVodafone3GC: function (ua) {
        var parts = ua.split(' ');
        var main = parts.shift().split('/');

        this.packet_compliant = true;
        this.type = '3GC';

        this.name = main[0];
        this.version = main[1];
        this.model = main[2];
        this._marker = main[3];
        this.serial_number = main[4];
        if (this.serial_number) {
            if (!this.serial_number.match(/^SN/)) {
                throw new NoMatchError(this);
            }
        }

        this.java_info = (function (parts) {
            var ret = {};
            parts.forEach(function (x) {
                var y = x.split('/');
                ret[y[0]] = y[1];
            });
            return ret;
        })(ua.match(/(Profile.*)$/)[1].split(' '));
    },
    _parseSoftbank3GC: function (ua) {
        this._parseVodafone3GC(ua);
    },
    _parseMotrola3GC: function (ua) {
        // MOT-V980/80.2B.04I MIB/2.2.1 Profile/MIDP-2.0 Configuration/CLDC-1.1
        var parts = ua.split(' ');
        var main = parts.shift().split('/');
        this.packet_compliant = true;
        this.type = '3GC';
        this.name = main[0];
        parts.shift();

        this.java_info = (function (parts) {
            var ret = {};
            parts.forEach(function (x) {
                var y = x.split('/');
                ret[y[0]] = y[1];
            });
            return ret;
        })(parts);

        if (this.name == 'MOT-V980') {
            this.model = 'V702MO';
        } else if (this.name == 'MOT-C980') {
            this.model = 'V702sMO';
        }
        if (!this.model) {
            this.request['x-jphone-msname'];
        }
    },
    _subtractUA: function (ua) {
        return ua.replace(/\s*\(compatible\s*[^\)]+\)/i, '');
    },
    _parseCrawler3GC: function (ua) {
        var parts = this._subtractUA(ua).split(' ');
        var main = parts.shift().split('/');

        // Nokia6820/2.0 (4.83) Profile/MIDP-1.0 Configuration/CLDC-1.0
        this.name = 'Vodafone';
        this.type = '3GC';
        this.model = main[0];

        parts.shift();
        this.java_info = (function (parts) {
            var ret = {};
            parts.forEach(function (x) {
                var y = x.split('/');
                ret[y[0]] = y[1];
            });
            return ret;
        })(parts);
    },
    _parseJPhone: function (ua) {
        var parts = this._subtractUA(ua).split(' ');
        var main = parts.shift().split('/');
        if (parts.length > 0) {
            // J-PHONE/4.0/J-SH51/SNJSHA3029293 SH/0001aa Profile/MIDP-1.0 Configuration/CLDC-1.0 Ext-Profile/JSCL-1.1.0
            // @{$self}{qw(name version model serial_number)} = split m!/!, $main;
            this.name = main[0];
            this.version = main[1];
            this.model = main[2];
            this.serial_number = main[3];
            if (this.serial_number) {
                if (!this.serial_number.match(/^SN/)) {
                    throw new NoMatchError(this);
                }
            }
            var vendor_data = parts.shift().split('/');
            this.vendor = vendor_data[0];
            this.vendor_version = vendor_data[1];

            this.java_info = (function (parts) {
                var ret = {};
                parts.forEach(function (x) {
                    var y = x.split('/');
                    ret[y[0]] = y[1];
                });
                return ret;
            })(parts);
        } else {
            // J-PHONE/2.0/J-DN02
            this.name = main[0];
            this.version = main[1];
            this.model = main[2];
            if (this.name === 'J-Phone') {
                // for J-Phone/5.0/J-SH03 (YahooSeeker)
                this.name = 'J-PHONE';
            }
            // $self->{vendor} = ($self->{model} =~ /J-([A-Z]+)/)[0] if $self->{model};
        }

        if (this.version.match(/^2\./)) {
            this.type = 'C2';
        } else if (this.version.match(/^3\./)) {
            if (this.request['x-jphone-java']) {
                this.type = 'C4';
            } else {
                this.type = 'C3';
            }
        } else if (this.version.match(/^4\./)) {
            var matched = this.java_info['Ext-Profile'].match(/JSCL-(\d.+)/);
            if (matched[1].match(/^1\.1\./)) {
                this.type = 'P4';
            } else if (matched[1] === '1.2.1') {
                this.type = 'P5';
            } else if (matched[1] === '1.2.2') {
                this.type = 'P6';
            } else {
                this.type = 'P7';
            }
        } else if (this.version.match(/^5\./)) {
            this.type = 'W';
        }
    }
}, {
    'getName': 'name',
    'getVersion': 'version',
    'getModel': 'model',
    'getSerialNumber': 'serial_number',
    'getType': 'type',
    'getJavaInfo': 'java_info',
});

function MobileAgentEZWeb(req) {
    this.constructor.super_.apply(this, arguments);
}
$E(MobileAgentEZWeb, MobileAgentBase, {
    is_ezweb: function () { return true; },
    getCarrier: function () { return 'E'; },
    getCarrierLongName: function () { return 'EZweb'; },
    getUserID: function () { return this.request['x-up-subno']; },
    _parse: function () {
        if (this.parsed) {
            return;
        }
        var ua = this.getUserAgent();
        var matched = ua.match(/^KDDI\-([^ ]+) ([^ \/]+)\/([^ ]+ [^ ]+) (.+)$/);
        if (matched) {
            this.device_id = matched[1];
            this.name = matched[2];
            this.version = matched[3];
            this.server = matched[4];
        } else {
            // UP.Browser/3.01-HI01 UP.Link/3.4.5.2 was OWAKON
            throw new NoMatchError(this);
        }
        this.parsed = true;
    }
}, {
    'getDeviceID': 'device_id',
    'getVersion': 'version',
    'getServer': 'server',
    'getName': 'name',
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
var MA;
if (typeof exports !== 'undefined') {
    MA = exports;
} else {
    MA = global.MobileAgent = {};
}
MA.getMobileAgent = getMobileAgent;
MA.detectCarrier = detectCarrier;
})();
