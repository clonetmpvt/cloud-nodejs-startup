const e = require("express");

var register = function (Handlebars) {
    var helpers = {
        // put all of your helpers inside this object
        foo: function () {
            return "FOO";
        },
        bar: function () {
            return "BAR";
        },
        ifCond: function (v1, v2, options) {
            if (v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        ifCondOper: function (v1, v2, v3, options) {
            //console.log(v1, v2, v3, options);
            if (v2 == "=") {
                if (v1 === v3) {
                    return options.fn(this);
                }
            } else if (v2 == "<") {
                if (v1 < v3) {
                    return options.fn(this);
                }
            } else if (v2 == ">") {
                if (v1 > v3) {
                    return options.fn(this);
                }
            } else if (v2 == ">=") {
                if (v1 >= v3) {
                    return options.fn(this);
                }
            } else if (v2 == "<=") {
                if (v1 <= v3) {
                    return options.fn(this);
                }
            }
            return options.inverse(this);
        },
        catShow: function (value) {
            return value && value[0] ? value[0] : value;
        },
        domainShow: function (value) {
            var site_url = process.env.SITE_URL;
            return site_url.replace("https://www.", '');
        },
        isLocal: function (options) {
            var local = process.env.IS_LOCAL;
            if (local == 'true') {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        isLive: function (options) {
            var local = process.env.IS_LOCAL;
            if (local != 'true') {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        showMobile: function (isMobile, options) {
            if (isMobile && isMobile == true) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        showAds: function (AD_NETWORK, SITE_CODE) {
            return AD_NETWORK == process.env.AD_NETWORK && SITE_CODE == process.env.SITE_CODE;
        },
        showAdsterraAds: function (SITE_CODE, options) {
            if (process.env.IS_LOCAL == "false" && process.env.AD_NETWORK == 'ADSTERRA' && SITE_CODE == process.env.SITE_CODE) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        showGoogleAds: function (options) {
            //console.log(process.env.IS_LOCAL == 'true');
            if (process.env.IS_LOCAL == "false" && process.env.AD_NETWORK == 'GOOGLE' && ('INDIAKNOWN' == process.env.SITE_CODE || 'BUSINESSBIGNEWS' == process.env.SITE_CODE)) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        showWebStoryAds: function (options) {
            //console.log(process.env.IS_LOCAL == 'true');
            let site = process.env.SITE_CODE;
            if (['INDIAKNOWN', 'MOVIESNEWSFEED', "SPORTSBESTNEWS", "BUSINESSBIGNEWS", "FREECRYPTOCOINSTIPS", "GADGETGAMENEWS", "HEALTHIKNOW", "LIFESTYLEBIGNEWS", "GAMELIVESTORY"].includes(site)) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        getOrdinalNum: function (n) {
            return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
        },
        everyFour: function (index, options) {
            if ((index + 1) % 4 == 0) {
                return options.fn(this);
            }
            return "";
        },
        showDate: function (dt) {
            var t = new Date(dt);

            const date = ('0' + t.getDate()).slice(-2);
            const month = ('0' + (t.getMonth() + 1)).slice(-2);
            const year = t.getFullYear();
            const hours = ('0' + t.getHours()).slice(-2);
            const minutes = ('0' + t.getMinutes()).slice(-2);
            const seconds = ('0' + t.getSeconds()).slice(-2);
            var n = t.getDate();
            const ordinalNum = n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
            let shortMonth = t.toLocaleString('en-us', { month: 'short' });
            let ampm = t.getHours() >= 12 ? 'PM' : "AM";
            var final = `${ordinalNum} ${shortMonth}, ${year}, ${hours}:${minutes} ${ampm}`;
            //console.log('dt', t.getFullYear(), ordinalNum, `${ordinalNum} ${shortMonth}, ${year}, ${hours}:${minutes} ${ampm}`);
            return final;
        },

    };

    if (Handlebars && typeof Handlebars.registerHelper === "function") {
        // register helpers
        for (var prop in helpers) {
            Handlebars.registerHelper(prop, helpers[prop]);
        }
    } else {
        // just return helpers object if we can't register helpers here
        return helpers;
    }

};

module.exports.register = register;
module.exports.helpers = register(null);   