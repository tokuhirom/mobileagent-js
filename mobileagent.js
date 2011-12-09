(function () {
    "use strict";

    exports.MobileAgent = MobileAgent;

    function MobileAgent(req) {
        var regexp = /^(DoCoMo|KDDI|Up\.Browser|J-PHONE|vodafone|SoftBank)/i;
        req.isMobile = regexp.test(ua);
    }

})();
