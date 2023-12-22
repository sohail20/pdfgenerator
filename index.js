const express = require('express');
const app = express();
const cors = require("cors")
const chromium = require('chrome-aws-lambda');
const puppeteer = require("puppeteer")
const axios = require("axios")
const bodyParser = require('body-parser');

const port = process.env.PORT || 3001;
app.use(cors())
app.use(bodyParser.json());

// app.use(function (req, res, next) {
//     res.header('Access-Control-Allow-Origin', 'https://master.d2q6u9m5y09j4z.amplifyapp.com');
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// });

app.get('/fetch-content', async (req, res) => {
    try {
        const response = await axios.get('https://the.akdn/en/resources-media/whats-new/news-release/prince-rahim-aga-khan-joins-world-leaders-at-cop28');
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).send('Error fetching content');
    }
});

async function createPdf(pageUrl) {
    try {
        const browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        // open a page in the browser
        // console.log(browser);
        const page = await browser.newPage();
        // set the HTTP Basic Authentication credential
        await page.authenticate({ 'username': 'dev-akdn', 'password': 'AKDN@#$%' });
        // console.log(process.env.HTACCESS_USERNAME, process.env.HTACCESS_PASSWORD);
        // visit the printable version of your page
        await page.goto(pageUrl, { waitUntil: 'networkidle0' });

        // update styles before creating pdf
        await page.addStyleTag({
            content: `
        .print-relatedSuggestions{
            display: none !important;
        }
        .print-header-menu{
            display: none !important;
        }
        .print-header-logo img{
            height: 72px !important;
        }
        `,
        });
        // generate the PDF
        const pdf = await page.pdf({ format: 'A4' });
        // don't forget to close the browser. Otherwise, it may cause performances issues or the server may even crash..
        await browser.close();

        return pdf
    } catch (error) {
        console.log("createPdf", error)
    }
    return false
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });

        // Scroll back to the top
        await new Promise((resolve) => {
            var totalHeight = document.body.scrollHeight;
            var distance = 100;

            var timer = setInterval(() => {
                window.scrollBy(0, -distance);
                totalHeight -= distance;

                if (totalHeight <= 0) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

// Define a basic route
app.post('/api/download-pdf', async (req, res) => {
    try {
        console.log("initializing")
        const url = req.body.url
        console.log("req.body", req.body)
        if (!url) return res.status(404).send({ message: "url not found" })
        const browser = await puppeteer.launch({ headless: 'new', executablePath: '/usr/bin/chromium-browser' });
        // const browser = await puppeteer.launch({ headless: 'new' });
        // , executablePath: '/usr/bin/chromium-browser' 
        console.log("browser", "https://dev.the.akdn" + url, browser)
        const page = await browser.newPage();
        console.log("page", page)

        //const url = 'https://the.akdn/en/resources-media/whats-new/news-release/un-deputy-secretary-general-calls-global-action-address-inequality-2019-pluralism?loadimages=true'; // Replace with your desired URL
        await page.authenticate({ 'username': 'dev-akdn', 'password': 'AKDN@#$%' });
        await page.goto("https://dev.the.akdn" + url, { waitUntil: 'networkidle0' });
        await page.setViewport({
            width: 1200,
            height: 2000
        });
        await autoScroll(page);

        // Set the path and options for PDF generation
        const pdfOptions = {
            format: 'A4',
        };

        // Generate PDF from the website content
        const pdf = await page.pdf(pdfOptions);

        await browser.close();
        res.setHeader('Content-disposition', 'inline; filename="download.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        res.end(pdf);
    } catch (error) {
        console.log("error", error)
        // loggerFunction("createPdf", error)
    }
});

app.post('/api/download-pdf-lambda', async (req, res) => {
    try {
        let body = req.body
        try {
            body = JSON.parse(body)
        } catch (error) {
            body = body
        }
        let pageUrl = (body && body.url) ? body.url : ""
        const pdf = await createPdf("https://the.akdn/en/resources-media/whats-new/news-release/prince-rahim-aga-khan-joins-world-leaders-at-cop28");
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdf.length);
        res.send(pdf)
    } catch (error) {
        console.log("error", error)
        // loggerFunction("createPdf", error)
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
