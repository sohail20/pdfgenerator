const express = require('express');
const app = express();
const cors = require("cors")
const puppeteer = require("puppeteer")
const port = process.env.PORT || 3001;
app.use(cors())
// Define a basic route
app.post('/api/download-pdf', async (req, res) => {
    try {
        console.log("initializing")
        // const browser = await puppeteer.launch({ headless: 'new', executablePath: '/usr/bin/chromium-browser' });
        const browser = await puppeteer.launch({ headless: 'new', executablePath: '/usr/bin/chromium-browser' });

        console.log("browser", browser)
        const page = await browser.newPage();
        const url = 'https://dev.the.akdn/en/resources-media/whats-new/news-release/un-deputy-secretary-general-calls-global-action-address-inequality-2019-pluralism?loadimages=true'; // Replace with your desired URL
        await page.authenticate({ 'username': 'dev-akdn', 'password': 'AKDN@#$%' });
        await page.goto(url, { waitUntil: 'networkidle0' });

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
