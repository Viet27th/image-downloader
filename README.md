This is a small Chrome extension (not including the Back-end on the server) that allows download images on the Website. There're some Websites that prevent downloading images and you can't download them by using this plugin, you need something dedicated more than this one with the Back-end on the server. I did it but did not publish it because I don't have money for the server rental :D

If you want to do something like that, you can refer these line of code below:

```

// Open Chromium browser
const browser = await puppeteer.launch({ headless: true });

try {
  // Open a new tab
  const page = await browser.newPage();

  // Allow interceptor when website make request 
  await page.setRequestInterception(true);

  // Check condition to allow website send request to server to get resource or not. We do that to make website load faster.
  // request.resourceType() can be "document,  font, stylesheet, script, image, xhr, fetch, other"
  page.on('request', async (request) => {
    if (
      request.resourceType() == 'font' ||
      request.resourceType() == 'stylesheet' ||
      request.resourceType() == 'script' ||
      request.resourceType() == 'xhr' ||
      request.resourceType() == 'fetch' ||
      // request.resourceType() == 'image' || // Just allow website send request to get images
      request.resourceType() == 'other'
    ) {
      await request.abort();
    } else {
      await request.continue();
    }
  })

  // When server response resource for Website, if reponse is an image, this is image we need to save.
  let imagesOnPage = {};
  await page.on('response', async (response) => {
    let url = response.url();
    let header = response.headers();
    // If response is an image
    if (header['content-type'] && header['content-type'].startsWith("image")) {
      // Convert image response from server to buffter
      const imageBuffer = await response.buffer();
      // Temporary save image buffer to an Object
      imagesOnPage[url] = imageBuffer;
    }
  })

  // Go to URL you want to get images.
  await page.goto("{your_url_want_to_get_images}", {
    waitUntil: 'networkidle0',
    timeout: 0, // Remove the timeout
  });

  // When page loaded success, you can return all the image here.
  await page.evaluate(async () => {
    return res.send(imagesOnPage);
  })

} catch (error) {

}

```