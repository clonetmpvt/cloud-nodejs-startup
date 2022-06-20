const { MongoClient } = require('mongodb');

const connectionString = process.env.ATLAS_URI;
const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnection;

module.exports = {
  connectToServer: function (callback) {
    client.connect(function (err, db) {
      if (err || !db) {
        return callback(err);
      }

      //dbConnection = db.db('sample_airbnb');
      console.log(process.env.DATABASE);
      dbConnection = db.db(process.env.DATABASE);
      console.log('Successfully connected to MongoDB.');

      return callback();
    });
  },

  getDb: function () {
    return dbConnection;
  },
  getCols: function () {
    return { 'id': 1, 'slug': 1, 'title': 1, 'sub_title': 1, 'image': 1, 'category': 1, 'view_count': 1, 'category_slug': 1, 'created_at': 1 };
  },
  getConnection: async function () {
    const client = new MongoClient(process.env.ATLAS_URI);
    await client.connect();
    const collection = client.db().collection('collection');
  },
  getSiteData: function () {
    return {
      IS_LOCAL: process.env.IS_LOCAL,
      ATLAS_URI: process.env.ATLAS_URI,
      PORT: process.env.PORT,
      DATABASE: process.env.DATABASE,
      SITE_URL: process.env.SITE_URL,
      AD_NETWORK: process.env.AD_NETWORK,
      SITE_CODE: process.env.SITE_CODE,
      SITE_NAME: process.env.SITE_NAME,
      TRACKING_ID: process.env.TRACKING_ID
    };
  },
  getSizes: function (size) {
    var sizes = {
      'default': { lossless: true, 'width': 500 },
      'small': { lossless: true, 'width': 220 },
      'medium': { lossless: true, 'width': 300 },
      'large': { lossless: true, 'width': 500 },
      'large-default': { lossless: true, 'width': 500, 'height': 300, fit: "fill" },
      'avatar_small': { lossless: true, 'width': 250, 'height': 250, fit: "fill" },
      'icon_64': { lossless: true, 'width': 64, 'height': 64, fit: "fill" },
      'icon_120': { lossless: true, 'width': 120, 'height': 120, fit: "fill" },
      'icon_144': { lossless: true, 'width': 144, 'height': 144, fit: "fill" },
      'icon_152': { lossless: true, 'width': 152, 'height': 152, fit: "fill" },
      'icon_192': { lossless: true, 'width': 192, 'height': 192, fit: "fill" },
      'icon_384': { lossless: true, 'width': 384, 'height': 384, fit: "fill" },
      'icon_512': { lossless: true, 'width': 512, 'height': 512, fit: "fill" },
      'icon_100': { lossless: true, 'width': 100, 'height': 100, fit: "fill" },
      'icon_300': { lossless: true, 'width': 300, 'height': 400, fit: "fill" },
      'icon_450': { lossless: true, 'width': 450, 'height': 800, fit: "fill" },
      'logo_60': { lossless: true, 'width': 600, 'height': 60, fit: "fill" },
      '1x1': { lossless: true, 'width': 1200, 'height': 1200, fit: "fill" },
      '4x3': { lossless: true, 'width': 1200, 'height': 900, fit: "fill" },
      '16x9': { lossless: true, 'width': 1200, 'height': 675, fit: "fill" },
      // 'web-story': {  lossless: true, 'width': 720, 'height': 1280 },
      // 'web-story-portrait': {  lossless: true, 'width': 768, 'height': 1024 },
      // 'web-story-landscape': {  lossless: true, 'width': 768, 'height': 1024 },
      // 'web-story-square': {  lossless: true, 'width': 768, 'height': 1024 },
      'web-story': { lossless: true, 'width': 720 },
      'web-story-portrait': { lossless: true, 'width': 1280, 'height': 960 },
      'web-story-landscape': { lossless: true, 'width': 960, 'height': 1280 },
      'web-story-square': { lossless: true, 'width': 1280, 'height': 1280, fit: "fill" },
    };

    if (sizes[size]) {
      return sizes[size];
    } else {
      return { 'w': 400 };
    }
  }
};
