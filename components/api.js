const admin = require('firebase-admin');
const serviceAccount = require('./clonetm-firebase-adminsdk-5lkx8-fb9e6db0de.json');
var axios = require("axios");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://clonetm.firebaseio.com"
});

const db = admin.firestore();
var pages = db.collection('pages');
var gethome = async function () {
    return await db.collection('pages').doc('home').get().then(doc => {
        if (!doc.exists) {
            return {};
        } else {
            return doc.data();
        }
    }).catch(error => {
        return {};
    });
}

var cloneslist = async function () {
    return await db.collection('pages').doc('home').get().then(doc => {
        if (!doc.exists) {
            return {};
        } else {
            return doc.data();
        }
    }).catch(error => {
        return {};
    });
}


var getbaseurl = async function (req) {
    var fullUrl = req.protocol + '://' + req.get('host');
    if (fullUrl.indexOf('localhost') > -1) {
        var static_url = 'http://localhost/node_fire/public/frontend';
    } else {
        var static_url = 'https://www.clonetm.com/frontend';
    }
    return static_url;
}

var siteurl = async function (req) {
    var fullUrl = req.protocol + '://' + req.get('host');
    return fullUrl;
}

var productlist = async function () {
    return await db.collection('section').doc('productclone').get().then(doc => {
        if (!doc.exists) {
            return {};
        } else {
            return doc.data();
        }
    }).catch(error => {
        return {};
    });
}

var getdoc = async function (slug) {
    return await pages.doc(slug).get().then(doc => {
        if (!doc.exists) {
            return {};
        } else {
            return doc.data();
        }
    }).catch(error => {
        return {};
    });
}

var setrequest = async function (data) {
    return db.collection('requestaquote').add(data).then(ref => {
        return 'success';
    }).catch(error => {
        return 'fail';
    });
}

var getjson = async function (slug) {
    return await axios.get('http://localhost/node_fire/public/api/' + slug + '.json');
}

var apidata = {
    getpage: async function (slug) {
        try {
            const doc = await pages.doc(slug).get();
            if (!doc.exists) {
                return {};
            }
            else {
                return doc.data();
            }
        }
        catch (error) {
            return {};
        }
    },
    getsection: async function () {
        try {
            const doc = await pages.doc('productclone').get();
            if (!doc.exists) {
                return {};
            }
            else {
                return doc.data();
            }
        }
        catch (error) {
            return {};
        }
    }
};


exports.siteurl = siteurl;
exports.getbaseurl = getbaseurl;
exports.setrequest = setrequest;
exports.getdoc = getdoc;
exports.getjson = getjson;
exports.gethome = gethome;
exports.cloneslist = cloneslist;
exports.productlist = productlist;
// exports.test = test;


