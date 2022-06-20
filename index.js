require('dotenv').config({ path: './config.env' });
//require('dotenv').config({ path: './../.env' });
const express = require('express');
const path = require("path");
//var compression = require('compression')
var hbs = require('express-handlebars');
var bodyParser = require('body-parser');
//var minifyHTML = require('express-minify-html');
const dbo = require('./db/conn');
const PORT = process.env.PORT || 5000;
const SITE_URL = process.env.SITE_URL || 'http://localhost:3333';
const app = express();
const _ = require("underscore");
const sharp = require("sharp");
const fs = require('fs');
const commonFun = require('./config/common');
const siteData = dbo.getSiteData();
const ampify = require('ampify');
var mobile = require('is-mobile');


app.use(bodyParser.urlencoded({ extended: true }));


app.engine('hbs', hbs.engine({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: require("./config/helpers.js").helpers,
}));

// app.use(express.static("/assets"));
app.set('view engine', 'hbs');
//app.use('/', express.static('./../public'))
app.use('/', express.static(path.join(__dirname, '/../public')))


// app.use(minifyHTML({
//     override: true,
//     // exception_url: false,
//     exception_url: [
//         '/feed', // String.
//     ],
//     // exception_url: [
//     //     'url_to_avoid_minify_html', // String.
//     //     /regex_to_analyze_req_to_avoid_minify/i, // Regex.
//     //     function(req, res) { // Function.
//     //         // Code to analyze req and decide if skips or not minify.
//     //         // Needs to return a boolean value.
//     //         return true
//     //     }
//     // ],
//     htmlMinifier: {
//         removeComments: true,
//         collapseWhitespace: true,
//         collapseBooleanAttributes: true,
//         removeAttributeQuotes: true,
//         removeEmptyAttributes: true,
//         minifyJS: true,
//         minifyCSS: true
//     }
// }));
//app.use(compression())
app.get("/", async (req, res) => {
    try {

        const dbConnect = dbo.getDb();
        let page_query = dbConnect.collection("pages").findOne({});
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", "MOST_VIEW_SEVEN", 'LATEST_20', 'HOME_DATA', "TRENDING_DATA"] } }).toArray();
        await Promise.all([page_query, pagedata_query]).then((result) => {
            let page = result[0] || {};
            if ((page && page._id)) {
                var homeData = page;
                let pagedata = result[1] || [];
                let tlatest_20 = _.where(pagedata, { type: "LATEST_20" });
                let latest_20 = [];
                _.each(tlatest_20, function (val, i) {
                    latest_20.push(val.data);
                });

                let ttrending_data = _.where(pagedata, { type: "TRENDING_DATA" });
                let trending_data = [];
                _.each(ttrending_data, function (val, i) {
                    trending_data.push(val.data);
                });
                //res.send(latest_20);
                let categories = _.where(pagedata, { type: "CAT_LIST" });
                let most_view_seven = _.where(pagedata, { type: "MOST_VIEW_SEVEN" });
                let first = _.first(latest_20);
                let sub_main = _.reject(latest_20, function (num, key) {
                    return key == 0 || key > 7;
                });
                let weekly_three = sub_main;
                let three_day_three = sub_main;
                let all_time_three = sub_main;

                page.json_ld = JSON.stringify([{ "@context": "https://schema.org", "@type": "WebSite", "url": SITE_URL + "/", "potentialAction": { "@type": "SearchAction", "target": SITE_URL + "?s={search_term_string}", "query-input": "required name=search_term_string" } }, { "@context": "https://schema.org", "@type": "Organization", "name": "Movies News Feed", "url": SITE_URL + "/", "logo": "https://st1.bgr.in\/wp-content\/themes\/bgr2017\/images\/new-logo-3\/BGR-website-logo.png", "sameAs": ["https://twitter.com\/bgrindia", "https://www.facebook.com\/BGRIndia"] }]);

                page.canonical = SITE_URL + "/";
                let final = {
                    first: first,
                    sub_main: sub_main,
                    page: page,
                    latest_20: latest_20,
                    categories: categories,
                    most_view_seven: most_view_seven,
                    three_day_three: three_day_three,
                    weekly_three: weekly_three,
                    all_time_three: all_time_three,
                    homeData: homeData,
                    isMobile: mobile({ ua: req }), ...siteData,
                    isMobile: mobile({ ua: req }),
                    trending_data: trending_data,
                    page_css: "index_css"
                };
                if (req.query.type && req.query.type == 'json') {
                    res.status(200).send({ isMobile: mobile({ ua: req }) });
                }
                res.render('home', final);
            } else {
                res.status(404).send('Not Found');
            }
        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});
app.get("/feed", async (req, res) => {
    try {
        // const dbConnect = dbo.getDb();
        // let latest_20 = await dbConnect.collection("page_content_final").find({}, { projection: dbo.getCols() }).limit(20).toArray();
        // latest_20 = latest_20 && latest_20.length > 0 ? latest_20 : [];
        // var final = {
        //     latest_20: latest_20,
        //     layout: 'blank',
        //     isMobile: mobile({ ua: req }),...siteData
        // };
        // res.header("Content-Type", "application/rss+xml");
        // res.render('feed', final);

        const dbConnect = dbo.getDb();
        let page_query = dbConnect.collection("pages").findOne({});
        let latest_20_query = dbConnect.collection("page_content_final").find({}, { projection: dbo.getCols() }).limit(20).toArray();
        await Promise.all([page_query, latest_20_query]).then((result) => {
            let page = result[0] || {};
            if ((page && page._id)) {
                let latest_20 = result[1] || [];
                page.canonical = SITE_URL + "/";
                let final = { page: page, latest_20: latest_20, isMobile: mobile({ ua: req }), ...siteData, layout: 'blank' };
                //res.status(200).send(final);
                res.header("Content-Type", "application/rss+xml");
                res.render('feed', final);
            } else {
                res.status(404).send('Not Found');
            }
        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});
app.get("/archive", async (req, res) => {
    try {

        const dbConnect = dbo.getDb();
        let page_query = dbConnect.collection("pages").findOne({});
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", "MOST_VIEW_SEVEN", 'LATEST_20', 'HOME_DATA'] } }).toArray();
        let all_category_query = dbConnect.collection("tbl_category").find({}).sort({ post_count: -1 }).toArray();
        await Promise.all([page_query, pagedata_query, all_category_query]).then((result) => {
            let page = result[0] || {};
            if ((page && page._id)) {
                var homeData = page;
                let all_category = result[2] || [];
                let pagedata = result[1] || [];
                let tlatest_20 = _.where(pagedata, { type: "LATEST_20" });
                let latest_20 = [];
                _.each(tlatest_20, function (val, i) {
                    latest_20.push(val.data);
                });
                //res.send(latest_20);
                let categories = _.where(pagedata, { type: "CAT_LIST" });
                let most_view_seven = _.where(pagedata, { type: "MOST_VIEW_SEVEN" });
                let first = _.first(latest_20);
                let sub_main = _.reject(latest_20, function (num, key) {
                    return key == 0 || key > 7;
                });
                let weekly_three = sub_main;
                let three_day_three = sub_main;
                let all_time_three = sub_main;

                page.json_ld = JSON.stringify([{ "@context": "https://schema.org", "@type": "WebSite", "url": SITE_URL + "/", "potentialAction": { "@type": "SearchAction", "target": SITE_URL + "?s={search_term_string}", "query-input": "required name=search_term_string" } }, { "@context": "https://schema.org", "@type": "Organization", "name": "Movies News Feed", "url": SITE_URL + "/", "logo": "https://st1.bgr.in\/wp-content\/themes\/bgr2017\/images\/new-logo-3\/BGR-website-logo.png", "sameAs": ["https://twitter.com\/bgrindia", "https://www.facebook.com\/BGRIndia"] }]);

                page.canonical = SITE_URL + "/archive";
                let final = {
                    first: first,
                    sub_main: sub_main,
                    page: page,
                    latest_20: latest_20,
                    categories: categories,
                    most_view_seven: most_view_seven,
                    three_day_three: three_day_three,
                    weekly_three: weekly_three,
                    all_time_three: all_time_three,
                    homeData: homeData,
                    isMobile: mobile({ ua: req }), ...siteData,
                    all_category: all_category,

                    page_css: "index_css"
                };
                if (req.query.type && req.query.type == 'json') {
                    res.status(200).send({ isMobile: mobile({ ua: req }) });
                }
                res.render('archive', final);
            } else {
                res.status(404).send('Not Found');
            }
        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});
app.get("/trending", async (req, res) => {
    try {

        const dbConnect = dbo.getDb();
        let page_query = dbConnect.collection("pages").findOne({});
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", "MOST_VIEW_SEVEN", 'LATEST_20', 'HOME_DATA', "TRENDING_DATA"] } }).toArray();

        await Promise.all([page_query, pagedata_query]).then((result) => {
            let page = result[0] || {};
            if ((page && page._id)) {
                var homeData = page;
                let pagedata = result[1] || [];
                let tlatest_20 = _.where(pagedata, { type: "LATEST_20" });
                let latest_20 = [];
                _.each(tlatest_20, function (val, i) {
                    latest_20.push(val.data);
                });
                //res.send(latest_20);
                let categories = _.where(pagedata, { type: "CAT_LIST" });
                let most_view_seven = _.where(pagedata, { type: "MOST_VIEW_SEVEN" });
                let first = _.first(latest_20);
                let sub_main = _.reject(latest_20, function (num, key) {
                    return key == 0 || key > 7;
                });

                let ttrending_data = _.where(pagedata, { type: "TRENDING_DATA" });
                let trending_data = [];
                _.each(ttrending_data, function (val, i) {
                    trending_data.push(val.data);
                });
                let weekly_three = sub_main;
                let three_day_three = sub_main;
                let all_time_three = sub_main;

                page.json_ld = JSON.stringify([{ "@context": "https://schema.org", "@type": "WebSite", "url": SITE_URL + "/", "potentialAction": { "@type": "SearchAction", "target": SITE_URL + "?s={search_term_string}", "query-input": "required name=search_term_string" } }, { "@context": "https://schema.org", "@type": "Organization", "name": "Movies News Feed", "url": SITE_URL + "/", "logo": "https://st1.bgr.in\/wp-content\/themes\/bgr2017\/images\/new-logo-3\/BGR-website-logo.png", "sameAs": ["https://twitter.com\/bgrindia", "https://www.facebook.com\/BGRIndia"] }]);

                page.canonical = SITE_URL + "/trending";
                let final = {
                    first: first,
                    sub_main: sub_main,
                    page: page,
                    latest_20: latest_20,
                    categories: categories,
                    most_view_seven: most_view_seven,
                    three_day_three: three_day_three,
                    weekly_three: weekly_three,
                    all_time_three: all_time_three,
                    homeData: homeData,
                    isMobile: mobile({ ua: req }), ...siteData,
                    trending_data: trending_data,
                    page_css: "index_css"
                };
                if (req.query.type && req.query.type == 'json') {
                    res.status(200).send({ isMobile: mobile({ ua: req }) });
                }
                res.render('trending', final);
            } else {
                res.status(404).send('Not Found');
            }
        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});

app.get("/:slug", async (req, res) => {
    try {
        var slug = req.params.slug;
        const dbConnect = dbo.getDb();

        let category = await dbConnect.collection("tbl_category").findOne({ slug: slug });
        var filterCat = (category && category._id) ? category.slug : "article";
        var pageNumber = 1;

        let page_query = dbConnect.collection("pages").findOne({});
        let latest_20_query = dbConnect.collection("page_content_final").find({}, { projection: dbo.getCols() }).sort({ created_at: -1 }).limit(20).toArray();
        let category_post_query = dbConnect.collection("page_content_final").find({ category_slug: { $all: [filterCat] } }, { projection: dbo.getCols() }).sort({ created_at: -1 }).limit(28).toArray();
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", 'TRENDING_DATA'] } }).toArray();
        let popular_query = dbConnect.collection("page_content_final").find({ category_slug: { $all: [filterCat] } }, { projection: dbo.getCols() }).sort({ view_count: -1 }).limit(20).toArray();
        let category_post_count_query = dbConnect.collection("page_content_final").count({ category_slug: { $all: [filterCat] } });
        await Promise.all([page_query, latest_20_query, pagedata_query, category_post_query, popular_query, category_post_count_query]).then((result) => {
            let page = result[0] || {};

            if ((page && page._id)) {
                var homeData = page;
                if (category && category._id) {
                    var title = category.title;
                    page = category;
                } else {
                    var title = 'Latest Article';
                    page.title = 'Latest Article';
                }
                page.seo = {
                    title: title + " : Latest news and update on " + title,
                    description: title + ", latest news on " + title + ", Trending on " + title,
                    keywords: title + ", latest news on " + title + ", Trending on " + title
                };
                let category_post = result[3] || [];
                let latest_20 = result[1] || [];
                let pagedata = result[2] || [];
                let categories = _.where(pagedata, { type: "CAT_LIST" });

                let ttrending_data = _.where(pagedata, { type: "TRENDING_DATA" });
                let trending_data = [];
                _.each(ttrending_data, function (val, i) {
                    trending_data.push(val.data);
                });


                let popular = result[4] || [];
                let category_post_count = result[5] || [];
                let max_page = Math.ceil(category_post_count / 28);

                page.json_ld = JSON.stringify([{ "@context": "https:\/\/schema.org", "@type": "WebSite", "url": SITE_URL + "", "potentialAction": { "@type": "SearchAction", "target": SITE_URL + "?s={search_term_string}", "query-input": "required name=search_term_string" } }, { "@context": "https:\/\/schema.org", "@type": "Organization", "name": siteData.SITE_NAME, "url": SITE_URL + "", "logo": "https:\/\/st1.bgr.in\/wp-content\/themes\/bgr2017\/images\/new-logo-3\/BGR-website-logo.png", "sameAs": ["https:\/\/twitter.com\/bgrindia", "https:\/\/www.facebook.com\/BGRIndia"] }, { "@context": "https:\/\/schema.org", "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "" }, { "@type": "ListItem", "position": 2, "name": page.title + "" }] }]);

                page.canonical = SITE_URL + "/" + slug;

                let final = {
                    page: page,
                    latest_20: latest_20,
                    categories: categories,
                    category_post: category_post,
                    homeData: homeData,
                    slug: filterCat,
                    popular: popular,
                    pageNumber: pageNumber,
                    prevPageNumber: (pageNumber == 0 || pageNumber == 1 ? 1 : (pageNumber - 1)),
                    nextPageNumber: pageNumber == max_page ? pageNumber : (pageNumber + 1),
                    isMobile: mobile({ ua: req }), ...siteData,
                    trending_data: trending_data,
                    page_css: "category_css"
                };

                if (req.query.type && req.query.type == 'json') {
                    res.status(200).send(final);
                }
                res.render('category', final);
            } else {
                return res.redirect('/');
                res.status(404).send('Not Found');
            }
        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});
app.get("/:slug/page/:pageNumber", async (req, res) => {
    try {
        var slug = req.params.slug;
        const dbConnect = dbo.getDb();

        let category = await dbConnect.collection("tbl_category").findOne({ slug: slug });
        var filterCat = (category && category._id) ? category.slug : "article";
        var pageNumber = req.params.pageNumber * 1;

        // console.log(filterCat, pageNumber);
        // res.status(200).send([filterCat, pageNumber]);

        let page_query = dbConnect.collection("pages").findOne({});
        let latest_20_query = dbConnect.collection("page_content_final").find({}, { projection: dbo.getCols() }).sort({ created_at: -1 }).limit(20).toArray();
        let category_post_query = dbConnect.collection("page_content_final").find({ category_slug: { $all: [filterCat] } }, { projection: dbo.getCols() }).sort({ created_at: -1 }).skip((pageNumber - 1) * 28).limit(28).toArray();
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", "TRENDING_DATA"] } }).toArray();
        let popular_query = dbConnect.collection("page_content_final").find({ category_slug: { $all: [filterCat] } }, { projection: dbo.getCols() }).sort({ view_count: -1 }).limit(20).toArray();
        let category_post_count_query = dbConnect.collection("page_content_final").count({ category_slug: { $all: [filterCat] } });
        await Promise.all([page_query, latest_20_query, pagedata_query, category_post_query, popular_query, category_post_count_query]).then((result) => {
            let page = result[0] || {};

            if ((page && page._id)) {
                var homeData = page;
                if (category && category._id) {
                    var title = category.title;
                    page = category;
                } else {
                    var title = 'Latest Article';
                    page.title = 'Latest Article';
                }
                page.seo = {
                    title: title + " : Latest news and update on " + title,
                    description: title + ", latest news on " + title + ", Trending on " + title,
                    keywords: title + ", latest news on " + title + ", Trending on " + title
                };
                let category_post = result[3] || [];
                let latest_20 = result[1] || [];
                let pagedata = result[2] || [];
                let categories = _.where(pagedata, { type: "CAT_LIST" });
                let popular = result[4] || [];
                let category_post_count = result[5] || [];
                let max_page = Math.ceil(category_post_count / 28);
                let ttrending_data = _.where(pagedata, { type: "TRENDING_DATA" });
                let trending_data = [];
                _.each(ttrending_data, function (val, i) {
                    trending_data.push(val.data);
                });

                page.json_ld = JSON.stringify([{ "@context": "https:\/\/schema.org", "@type": "WebSite", "url": SITE_URL + "", "potentialAction": { "@type": "SearchAction", "target": SITE_URL + "?s={search_term_string}", "query-input": "required name=search_term_string" } }, { "@context": "https:\/\/schema.org", "@type": "Organization", "name": siteData.SITE_NAME, "url": SITE_URL + "", "logo": "https:\/\/st1.bgr.in\/wp-content\/themes\/bgr2017\/images\/new-logo-3\/BGR-website-logo.png", "sameAs": ["https:\/\/twitter.com\/bgrindia", "https:\/\/www.facebook.com\/BGRIndia"] }, { "@context": "https:\/\/schema.org", "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "" }, { "@type": "ListItem", "position": 2, "name": page.title + "" }] }]);

                page.canonical = SITE_URL + "/" + slug + '/page/' + pageNumber;

                let final = {
                    page: page,
                    latest_20: latest_20,
                    categories: categories,
                    category_post: category_post,
                    homeData: homeData,
                    slug: filterCat,
                    popular: popular,
                    pageNumber: pageNumber,
                    prevPageNumber: (pageNumber == 0 || pageNumber == 1 ? 1 : (pageNumber - 1)),
                    nextPageNumber: pageNumber == max_page ? pageNumber : (pageNumber + 1),
                    isMobile: mobile({ ua: req }), ...siteData,
                    trending_data: trending_data,
                    page_css: "category_css"
                };

                if (req.query.type && req.query.type == 'json') {
                    res.status(200).send(final);
                }
                res.render('category', final);
            } else {
                res.status(404).send('Not Found');
            }
        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});
app.get("/page/:pageNumber", async (req, res) => {
    try {
        var slug = req.params.slug;
        const dbConnect = dbo.getDb();
        var pageNumber = req.params.pageNumber * 1;
        //console.log(pageNumber);
        var filterCat = "article";
        let page_query = dbConnect.collection("pages").findOne({});
        let latest_20_query = dbConnect.collection("page_content_final").find({}, { projection: dbo.getCols() }).sort({ created_at: -1 }).limit(20).toArray();

        let category_post_query = dbConnect.collection("page_content_final").find({ category_slug: { $all: [filterCat] } }, { projection: dbo.getCols() }).sort({ created_at: -1 }).skip((pageNumber - 1) * 28).limit(28).toArray();
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", "TRENDING_DATA"] } }).toArray();
        let popular_query = dbConnect.collection("page_content_final").find({ category_slug: { $all: [filterCat] } }, { projection: dbo.getCols() }).sort({ view_count: -1 }).limit(20).toArray();
        let category_post_count = dbConnect.collection("page_content_final").count({ category_slug: { $all: [filterCat] } });

        await Promise.all([page_query, latest_20_query, pagedata_query, category_post_query, popular_query, category_post_count]).then((result) => {
            let page = result[0] || {};

            if ((page && page._id)) {

                var homeData = page;

                var title = ' Latest News Page ' + pageNumber;
                page.title = ' Latest News Page ' + pageNumber;

                page.seo = {
                    title: title + " : Latest news and update on " + title,
                    description: title + ", latest news on " + title + ", Trending on " + title,
                    keywords: title + ", latest news on " + title + ", Trending on " + title
                };
                let category_post = result[3] || [];
                let latest_20 = result[1] || [];
                let pagedata = result[2] || [];
                let categories = _.where(pagedata, { type: "CAT_LIST" });
                let popular = result[4] || [];

                let ttrending_data = _.where(pagedata, { type: "TRENDING_DATA" });
                let trending_data = [];
                _.each(ttrending_data, function (val, i) {
                    trending_data.push(val.data);
                });


                page.json_ld = JSON.stringify([{ "@context": "https:\/\/schema.org", "@type": "WebSite", "url": SITE_URL + "", "potentialAction": { "@type": "SearchAction", "target": SITE_URL + "?s={search_term_string}", "query-input": "required name=search_term_string" } }, { "@context": "https:\/\/schema.org", "@type": "Organization", "name": siteData.SITE_NAME, "url": SITE_URL + "", "logo": "https:\/\/st1.bgr.in\/wp-content\/themes\/bgr2017\/images\/new-logo-3\/BGR-website-logo.png", "sameAs": ["https:\/\/twitter.com\/bgrindia", "https:\/\/www.facebook.com\/BGRIndia"] }, { "@context": "https:\/\/schema.org", "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "" }, { "@type": "ListItem", "position": 2, "name": page.title + "" }] }]);

                page.canonical = SITE_URL + "/" + slug;

                let final = {
                    page: page,
                    latest_20: latest_20,
                    categories: categories,
                    category_post: category_post,
                    homeData: homeData,
                    slug: filterCat,
                    popular: popular,
                    pageNumber: pageNumber,
                    prevPageNumber: (pageNumber == 0 || pageNumber == 1 ? 1 : (pageNumber - 1)),
                    nextPageNumber: (pageNumber + 1),
                    isMobile: mobile({ ua: req }), ...siteData,
                    trending_data: trending_data,
                    page_css: "category_css"
                };
                // return res.status(200).send([pageNumber, pageNumber + '']);

                if (req.query.type && req.query.type == 'json') {
                    res.status(200).send(final);
                }
                res.render('articlePage', final);
            } else {
                res.status(404).send('Not Found');
            }
        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});

app.get("/article/:slug", async (req, res) => {
    try {
        var slug = req.params.slug;
        const dbConnect = dbo.getDb();
        let page = await dbConnect.collection("page_content_final").findOne({ slug: slug });
        if (!(page && page._id)) {
            console.log("404" + unescape(req.path));
            //console.log("404" + );
            return res.redirect('/');
            return res.status(404).send(404);
        }
        //res.json(page);
        let home_query = dbConnect.collection("pages").findOne({});
        let latest_20_query = dbConnect.collection("page_content_final").find({}, { projection: dbo.getCols() }).sort({ created_at: -1 }).limit(20).toArray();
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", "TRENDING_DATA"] } }).toArray();
        let popular_query = dbConnect.collection("page_content_final").find({ _id: { $lt: page._id } }).sort({ _id: -1 }).limit(15).toArray();



        let catSlugs = page.category_slug && page.category_slug.length > 0 ? page.category_slug : [0];
        let post_cat_list_query = dbConnect.collection("tbl_category").find({ slug: { $in: catSlugs } }).toArray();
        await Promise.all([home_query, latest_20_query, pagedata_query, popular_query, post_cat_list_query]).then((result) => {
            let homeData = result[0] || {};

            let latest_20 = result[1] || [];
            let pagedata = result[2] || [];
            let categories = _.where(pagedata, { type: "CAT_LIST" });
            // let most_view_seven = _.where(pagedata, { type: "MOST_VIEW_SEVEN" });
            let first = _.first(latest_20);
            let sub_main = _.reject(latest_20, function (num, key) {
                return key == 0 || key > 7;
            });
            let post_cat_list = result[4] || [];
            let popular = result[3] || [];

            let ttrending_data = _.where(pagedata, { type: "TRENDING_DATA" });
            let trending_data = [];
            _.each(ttrending_data, function (val, i) {
                trending_data.push(val.data);
            });


            page.json_ld = JSON.stringify([
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "NewsArticle",
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": SITE_URL + "\/article\/" + page.slug
                    },
                    "headline": page.title,
                    "image": [
                        SITE_URL + "\/thumb\/1x1" + page.image,
                        SITE_URL + "\/thumb\/4x3" + page.image,
                        SITE_URL + "\/thumb\/16x9" + page.image
                    ],
                    "datePublished": commonFun.commonFun.dateFormat(page.created_at),
                    "dateModified": commonFun.commonFun.dateFormat(page.created_at),
                    "author": {
                        "@type": "Person",
                        "name": "CloneTM",
                        "url": "https:\/\/www.clonetm.com\/"
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "CloneTM",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https:\/\/res.cloudinary.com\/clonetm\/image\/upload\/c_scale,w_125,h_50,q_auto,f_auto\/v1560782767\/logo\/logo-small.png"
                        }
                    }
                },
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": SITE_URL + ""
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Article",
                            "item": SITE_URL + "/article"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": page.title
                        }
                    ]
                }
            ]);

            //console.log(page.json_ld);

            page.canonical = SITE_URL + "/article/" + page.slug;
            page.ampUrl = SITE_URL + "/article/" + page.slug + '/amp';
            let final = {
                first: first,
                sub_main: sub_main,
                page: page,
                latest_20: latest_20,
                categories: categories,
                homeData: homeData,
                post_cat_list: post_cat_list,
                popular: popular,
                isMobile: mobile({ ua: req }), ...siteData,
                trending_data: trending_data,
                page_css: "post_css"
            };
            if (req.query.type && req.query.type == 'json') {
                res.status(200).send(final);
            }
            res.render('article', final);

        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});

app.get("/article/:slug/amp", async (req, res) => {
    try {
        var slug = req.params.slug;
        const dbConnect = dbo.getDb();
        let page = await dbConnect.collection("page_content_final").findOne({ slug: slug });
        if (!(page && page._id)) {
            return res.redirect('/');
            res.status(404).send(404);
        }
        //res.json(page);
        let home_query = dbConnect.collection("pages").findOne({});
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST"] } }).toArray();
        let popular_query = dbConnect.collection("page_content_final").find({ _id: { $lt: page._id } }).sort({ _id: -1 }).limit(15).toArray();
        let latest_20_query = dbConnect.collection("page_content_final").find({ _id: { $lt: page._id } }).sort({ _id: -1 }).limit(15).toArray();
        //page.content = await img2AmpImg(page.content);
        page.content = await ampify(page.content, { cwd: 'amp' });
        //const ampImgTag = await img2AmpImg(imageTag);
        await Promise.all([home_query, pagedata_query, popular_query, latest_20_query]).then((result) => {
            let homeData = result[0] || {};
            let pagedata = result[1] || [];
            let popular = result[2] || [];
            let latest_20 = result[3] || [];

            let categories = _.where(pagedata, { type: "CAT_LIST" });

            page.json_ld = JSON.stringify([
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "NewsArticle",
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": SITE_URL + "\/article\/" + page.slug
                    },
                    "headline": page.title,
                    "image": [
                        SITE_URL + "\/thumb\/1x1" + page.image,
                        SITE_URL + "\/thumb\/4x3" + page.image,
                        SITE_URL + "\/thumb\/16x9" + page.image
                    ],
                    "datePublished": commonFun.commonFun.dateFormat(page.created_at),
                    "dateModified": commonFun.commonFun.dateFormat(page.created_at),
                    "author": {
                        "@type": "Person",
                        "name": "CloneTM",
                        "url": "https:\/\/www.clonetm.com\/"
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "CloneTM",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https:\/\/res.cloudinary.com\/clonetm\/image\/upload\/c_scale,w_125,h_50,q_auto,f_auto\/v1560782767\/logo\/logo-small.png"
                        }
                    }
                },
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": SITE_URL + ""
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Article",
                            "item": SITE_URL + "\/article"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": page.title
                        }
                    ]
                }
            ]);

            //console.log(page.json_ld);

            page.canonical = SITE_URL + "/article/" + page.slug;
            //page.ampUrl = SITE_URL + "/article/" + page.slug + '/amp';



            let final = {
                page: page,
                categories: categories,
                homeData: homeData,
                popular: popular,
                latest_20: latest_20,
                isMobile: mobile({ ua: req }), ...siteData,
                layout: 'blank'
            };
            if (req.query.type && req.query.type == 'json') {
                res.status(200).send(final);
            }

            // res.render('amp', final, async (err, html) => {
            //     const optimizedHtml = await ampOptimizer.transformHtml(html);
            //     res.send(optimizedHtml);
            // });
            res.render('amp', final);
            // res.render('amp', final, async (err, html) => {
            //     const optimizedHtml = await ampify(html, { cwd: 'amp' });
            //     res.send(optimizedHtml);
            // });

        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});
app.get("/web-story/article/:slug", async (req, res) => {
    try {
        var slug = req.params.slug;
        const dbConnect = dbo.getDb();
        let page = await dbConnect.collection("page_content_final").findOne({ slug: slug });
        if (!(page && page._id)) {
            return res.redirect('/');
            res.status(404).send(404);
        }
        //res.json(page);
        let home_query = dbConnect.collection("pages").findOne({});
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", 'LATEST_20', 'HOME_DATA'] } }).toArray();
        let story1_query = dbConnect.collection("page_content_final").find({ _id: { $lt: page._id, $ne: page._id } }, { projection: dbo.getCols() }).sort({ _id: -1 }).limit(5).toArray();
        //page.content = await img2AmpImg(page.content);
        page.content = await ampify(page.content, { cwd: 'amp' });
        //const ampImgTag = await img2AmpImg(imageTag);
        await Promise.all([home_query, pagedata_query, story1_query]).then((result) => {
            let homeData = result[0] || {};
            let pagedata = result[1] || [];
            let otherStories = result[2] || [];
            let otherStoriesIds = _.pluck(otherStories, '_id');
            var stories = [page];
            let tlatest_20 = _.where(pagedata, { type: "LATEST_20" });

            _.each(otherStories, function (val, i) {
                stories.push(val);
            });
            var ic = 0;
            _.each(tlatest_20, function (val, i) {
                if (ic < 6 && !otherStoriesIds.includes(val._id)) {
                    stories.push(val.data);
                    ic++;
                }
            });
            page.stories = stories;

            let categories = _.where(pagedata, { type: "CAT_LIST" });

            page.json_ld = JSON.stringify([
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "NewsArticle",
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": SITE_URL + "\/article\/" + page.slug
                    },
                    "headline": page.title,
                    "image": [
                        SITE_URL + "\/thumb\/1x1" + page.image,
                        SITE_URL + "\/thumb\/4x3" + page.image,
                        SITE_URL + "\/thumb\/16x9" + page.image
                    ],
                    "datePublished": commonFun.commonFun.dateFormat(page.created_at),
                    "dateModified": commonFun.commonFun.dateFormat(page.created_at),
                    "author": {
                        "@type": "Person",
                        "name": "CloneTM",
                        "url": "https:\/\/www.clonetm.com\/"
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "CloneTM",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https:\/\/res.cloudinary.com\/clonetm\/image\/upload\/c_scale,w_125,h_50,q_auto,f_auto\/v1560782767\/logo\/logo-small.png"
                        }
                    }
                },
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": SITE_URL + ""
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Article",
                            "item": SITE_URL + "\/article"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": page.title
                        }
                    ]
                }
            ]);

            //console.log(page.json_ld);

            page.canonical = SITE_URL + "/web-story/article/" + page.slug;
            //page.ampUrl = SITE_URL + "/article/" + page.slug + '/amp';



            let final = {
                page: page,
                categories: categories,
                homeData: homeData,
                stories: stories,
                isMobile: mobile({ ua: req }), ...siteData,
                layout: 'blank'
            };
            if (req.query.type && req.query.type == 'json') {
                res.status(200).send(final);
            }

            // res.render('amp', final, async (err, html) => {
            //     const optimizedHtml = await ampOptimizer.transformHtml(html);
            //     res.send(optimizedHtml);
            // });
            res.render('webStory', final);
            // res.render('amp', final, async (err, html) => {
            //     const optimizedHtml = await ampify(html, { cwd: 'amp' });
            //     res.send(optimizedHtml);
            // });

        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});

app.get("/web-story/category/:slug", async (req, res) => {
    try {
        var slug = req.params.slug;
        const dbConnect = dbo.getDb();
        let page = await dbConnect.collection("tbl_category").findOne({ slug: slug });
        if (!(page && page._id)) {
            return res.redirect('/');
            res.status(404).send(404);
        }
        //res.json(page);

        let pagedata_query = await dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", 'LATEST_20', 'HOME_DATA'] } }).toArray();
        let story1_query = dbConnect.collection("page_content_final").find({ category_slug: { $all: [slug] } }, { projection: dbo.getCols() }).sort({ created_at: -1 }).limit(10).toArray();
        // let homeData = _.findWhere(pagedata_query, { type: "HOME_DATA" });
        // homeData = homeData.data;
        // res.send(homeData);

        //const ampImgTag = await img2AmpImg(imageTag);
        await Promise.all([pagedata_query, story1_query]).then((result) => {
            //res.send(homeData);
            let pagedata = result[0] || [];
            let homeData = _.findWhere(pagedata, { type: "HOME_DATA" });
            homeData = homeData.data;
            let otherStories = result[1] || [];
            let otherStoriesIds = _.pluck(otherStories, "_id");
            let tlatest_20 = _.where(pagedata, { type: "LATEST_20" });
            let first = _.first(otherStories);
            var title = page.title;
            page.seo = {
                title: title + " : Latest news and update on " + title,
                description: title + ", latest news on " + title + ", Trending on " + title,
                keywords: title + ", latest news on " + title + ", Trending on " + title
            };

            page.image = first.image;

            //res.send([page, first]);

            var stories = [page];
            _.each(otherStories, function (val, i) {
                if (i != 0) {
                    stories.push(val);
                }
            });
            var ic = 0;
            _.each(tlatest_20, function (val, i) {
                if (ic < 6 && !otherStoriesIds.includes(val._id)) {
                    stories.push(val.data);
                    ic++;
                }
            });
            //page.stories = stories;

            page.json_ld = JSON.stringify([
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "NewsArticle",
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": SITE_URL + "\/article\/" + page.slug
                    },
                    "headline": page.title,
                    "image": [
                        SITE_URL + "\/thumb\/1x1" + page.image,
                        SITE_URL + "\/thumb\/4x3" + page.image,
                        SITE_URL + "\/thumb\/16x9" + page.image
                    ],
                    "datePublished": commonFun.commonFun.dateFormat(page.created_at),
                    "dateModified": commonFun.commonFun.dateFormat(page.created_at),
                    "author": {
                        "@type": "Person",
                        "name": "CloneTM",
                        "url": "https:\/\/www.clonetm.com\/"
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "CloneTM",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https:\/\/res.cloudinary.com\/clonetm\/image\/upload\/c_scale,w_125,h_50,q_auto,f_auto\/v1560782767\/logo\/logo-small.png"
                        }
                    }
                },
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": SITE_URL + ""
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Article",
                            "item": SITE_URL + "\/article"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": page.title
                        }
                    ]
                }
            ]);

            //console.log(page.json_ld);

            page.canonical = SITE_URL + "/web-story/category/" + slug;
            //page.ampUrl = SITE_URL + "/article/" + page.slug + '/amp';



            let final = {
                page: page,
                homeData: homeData,
                stories: stories,
                isMobile: mobile({ ua: req }), ...siteData,
                layout: 'blank'
            };
            if (req.query.type && req.query.type == 'json') {
                res.status(200).send(final);
            }

            // res.render('amp', final, async (err, html) => {
            //     const optimizedHtml = await ampOptimizer.transformHtml(html);
            //     res.send(optimizedHtml);
            // });
            res.render('webStory', final);
            // res.render('amp', final, async (err, html) => {
            //     const optimizedHtml = await ampify(html, { cwd: 'amp' });
            //     res.send(optimizedHtml);
            // });

        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});
app.get("/web-story/trending/:slug", async (req, res) => {
    try {
        var slug = req.params.slug;
        const dbConnect = dbo.getDb();
        let page = await dbConnect.collection("google_topics").findOne({ slug: slug });
        if (!(page && page._id)) {
            return res.redirect('/');
            res.status(404).send(404);
        }
        //res.json(page);
        let home_query = dbConnect.collection("pages").findOne({});
        let pagedata_query = dbConnect.collection("tbl_page_data").find({ type: { $in: ["CAT_LIST", 'LATEST_20', 'HOME_DATA'] } }).toArray();

        //page.content = await img2AmpImg(page.content);
        // page.content = await ampify(page.content, { cwd: 'amp' });
        //const ampImgTag = await img2AmpImg(imageTag);
        await Promise.all([home_query, pagedata_query]).then((result) => {
            let homeData = result[0] || {};
            let pagedata = result[1] || [];

            var stories = [page];
            page.stories = stories = page.post_list;


            let categories = _.where(pagedata, { type: "CAT_LIST" });

            page.json_ld = JSON.stringify([
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "NewsArticle",
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": SITE_URL + "\/article\/" + page.slug
                    },
                    "headline": page.title,
                    "image": [
                        SITE_URL + "\/thumb\/1x1" + page.image,
                        SITE_URL + "\/thumb\/4x3" + page.image,
                        SITE_URL + "\/thumb\/16x9" + page.image
                    ],
                    "datePublished": commonFun.commonFun.dateFormat(page.created_at),
                    "dateModified": commonFun.commonFun.dateFormat(page.created_at),
                    "author": {
                        "@type": "Person",
                        "name": "CloneTM",
                        "url": "https:\/\/www.clonetm.com\/"
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "CloneTM",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https:\/\/res.cloudinary.com\/clonetm\/image\/upload\/c_scale,w_125,h_50,q_auto,f_auto\/v1560782767\/logo\/logo-small.png"
                        }
                    }
                },
                {
                    "@context": "https:\/\/schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": SITE_URL + ""
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Article",
                            "item": SITE_URL + "\/article"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": page.title
                        }
                    ]
                }
            ]);

            //console.log(page.json_ld);

            page.canonical = SITE_URL + "/web-story/trending/" + page.slug;
            //page.ampUrl = SITE_URL + "/article/" + page.slug + '/amp';



            let final = {
                page: page,
                categories: categories,
                homeData: homeData,
                stories: stories,
                isMobile: mobile({ ua: req }), ...siteData,
                layout: 'blank'
            };
            if (req.query.type && req.query.type == 'json') {
                res.status(200).send(final);
            }

            // res.render('amp', final, async (err, html) => {
            //     const optimizedHtml = await ampOptimizer.transformHtml(html);
            //     res.send(optimizedHtml);
            // });
            res.render('webStory', final);
            // res.render('amp', final, async (err, html) => {
            //     const optimizedHtml = await ampify(html, { cwd: 'amp' });
            //     res.send(optimizedHtml);
            // });

        }).catch(error => {
            res.status(500).send(error);
        })
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});

app.get("/thumb/:size/*", async (req, res) => {
    try {
        var size = req.params.size;
        var path = req.path.split(size);
        if (!(path && path[1])) {
            res.status(404).send(404);
        }
        var rPath = './../public' + path[1];
        var dPath = './../public/thumb/' + size + path[1];
        if (!fs.existsSync(rPath)) {
            //res.status(404).send(404);
            rPath = './../public/images/DEFAULT_IMG.webp';
            dPath = './../public/thumb/' + size + path[1];
        }
        var dPathDir = dPath.split("/");
        dPathDir.pop();
        dPathDir = dPathDir.join("/");
        // console.log(req.path, path, dPath, dPathDir, sizeParms);
        if (!fs.existsSync(dPathDir)) {
            fs.mkdirSync(dPathDir, { recursive: true, mode: 0o777 });
        }
        var sizeParms = dbo.getSizes(size);
        // sizeParms.fit = sharp.fit.fill;
        // sizeParms.position = sharp.position.fit;
        // //sizeParms.fit = "contain";
        // //sizeParms.kernel = sharp.kernel.nearest;
        // //sizeParms.withoutEnlargement = true;
        //const image = sharp('./../public/images/article/twitter8217s-acquisition-strategy-eat-the-public-conversation-main.webp');
        //console.log(image);
        console.log(sizeParms, rPath, req.path);
        const image = sharp(rPath);
        var img = await image
            .metadata()
            .then(function (metadata) {
                var timg = image
                    .resize(sizeParms)
                    .webp();
                return timg;
                // //return image
                //     .resize(Math.round(metadata.width / 2))
                //     .webp()
                //     .toBuffer();
            })
            .then(function (data) {
                //console.log(data);
                data.toFile(dPath);
                return data.toBuffer();
            });
        // console.log(img);
        res.writeHead(200, {
            'Content-Type': 'image/webp',
            'Content-Length': img.length
        });
        res.end(img);
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});
app.get("/images/manifest.json", async (req, res) => {
    try {
        var arr = {
            "name": siteData.SITE_NAME,
            "short_name": siteData.SITE_CODE,
            "description": siteData.SITE_NAME,
            "icons": [
                {
                    "src": SITE_URL + "/thumb/icon_64/images/logo.webp",
                    "sizes": "64x64",
                    "type": "image/png"
                },
                {
                    "src": SITE_URL + "/thumb/icon_120/images/logo.webp",
                    "sizes": "120x120",
                    "type": "image/png"
                },
                {
                    "src": SITE_URL + "/thumb/icon_144/images/logo.webp",
                    "sizes": "144x144",
                    "type": "image/png"
                },
                {
                    "src": SITE_URL + "/thumb/icon_152/images/logo.webp",
                    "sizes": "152x152",
                    "type": "image/png"
                },
                {
                    "src": SITE_URL + "/thumb/icon_192/images/logo.webp",
                    "sizes": "192x192",
                    "type": "image/png"
                },
                {
                    "src": SITE_URL + "/thumb/icon_384/images/logo.webp",
                    "sizes": "384x384",
                    "type": "image/png"
                },
                {
                    "src": SITE_URL + "/thumb/icon_512/images/logo.webp",
                    "sizes": "512x512",
                    "type": "image/png"
                }
            ],
            "start_url": "/",
            "display": "standalone",
            "background_color": "#d72924",
            "theme_color": "#d72924",
            "lang": "en"
        };
        res.status(200).json(arr);
    } catch (e) {
        console.error(`Error : ` + req.path);
        console.error(`try/catch(${e})`);
    }
});
// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
// })
dbo.connectToServer(function (err) {
    if (err) {
        console.error(err);
        process.exit();
    }

    // start the Express server
    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
});
