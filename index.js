const express = require('express');
const app = express();
const cors = require("cors")
const puppeteer = require("puppeteer")
const axios = require("axios")

const port = process.env.PORT || 3001;
app.use(cors())

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
    });
}

// Define a basic route
app.post('/api/download-pdf', async (req, res) => {
    try {
        console.log("initializing")
        const browser = await puppeteer.launch({ headless: 'new', executablePath: '/usr/bin/chromium-browser' });
        // const browser = await puppeteer.launch({ headless: 'new' });
        // , executablePath: '/usr/bin/chromium-browser' 
        console.log("browser", browser)
        const page = await browser.newPage();
        const url = 'https://the.akdn/en/resources-media/whats-new/news-release/prince-rahim-aga-khan-joins-world-leaders-at-cop28'; // Replace with your desired URL
        await page.authenticate({ 'username': 'dev-akdn', 'password': 'AKDN@#$%' });
        await page.goto(url, { waitUntil: 'networkidle0' });
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

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
