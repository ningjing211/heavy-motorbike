const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// The URL of the website
const url = 'https://berlin.tj-tech.pro/';

// Create a directory to save images
const imageDir = path.join(__dirname, 'berlin_images');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir);
}

// Function to download image
const downloadImage = async (url, filename) => {
    try {
        const response = await axios({
            url,
            responseType: 'stream',
        });
        response.data.pipe(fs.createWriteStream(filename));
        console.log(`Downloaded: ${url}`);
    } catch (error) {
        console.log(`Failed to download ${url}: ${error.message}`);
    }
};

// Function to extract background images from CSS files
const extractCssBackgroundImages = async (cssUrl) => {
    try {
        const response = await axios.get(cssUrl);
        const css = response.data;
        const imageUrls = [];
        const regex = /background-image:\s*url\(["']?(.*?)["']?\);/g;
        let match;
        while ((match = regex.exec(css)) !== null) {
            let imgUrl = match[1];
            if (!imgUrl.startsWith('http')) {
                imgUrl = new URL(imgUrl, cssUrl).href;
            }
            imageUrls.push(imgUrl);
        }
        return imageUrls;
    } catch (error) {
        console.log(`Failed to extract CSS background images: ${error.message}`);
        return [];
    }
};

// Function to scrape images, including CSS background images
const scrapeImages = async () => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const imageUrls = [];

        // Grab <img> tags
        $('img').each((index, element) => {
            let imgUrl = $(element).attr('src');
            if (imgUrl && !imgUrl.startsWith('http')) {
                imgUrl = new URL(imgUrl, url).href;
            }
            if (imgUrl && !imageUrls.includes(imgUrl)) {
                imageUrls.push(imgUrl);
            }
        });

        // Grab background images from style attributes
        $('[style*="background"]').each((index, element) => {
            const style = $(element).attr('style');
            const bgUrlMatch = style.match(/url\(["']?(.*?)["']?\)/);
            if (bgUrlMatch) {
                let imgUrl = bgUrlMatch[1];
                if (!imgUrl.startsWith('http')) {
                    imgUrl = new URL(imgUrl, url).href;
                }
                if (!imageUrls.includes(imgUrl)) {
                    imageUrls.push(imgUrl);
                }
            }
        });

        // Grab CSS files and extract background images
        $('link[rel="stylesheet"]').each(async (index, element) => {
            const cssHref = $(element).attr('href');
            if (cssHref) {
                const cssUrl = new URL(cssHref, url).href;
                const cssImages = await extractCssBackgroundImages(cssUrl);
                cssImages.forEach((imgUrl) => {
                    if (!imageUrls.includes(imgUrl)) {
                        imageUrls.push(imgUrl);
                    }
                });
            }
        });

        // Download images in the specific order
        for (let i = 0; i < imageUrls.length; i++) {
            const imgFilename = path.join(imageDir, `image_${i + 1}.jpg`);
            await downloadImage(imageUrls[i], imgFilename);
        }
    } catch (error) {
        console.log(`Error occurred while scraping: ${error.message}`);
    }
};

// Start the scraping process
scrapeImages();
