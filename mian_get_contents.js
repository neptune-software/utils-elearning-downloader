import puppeteer, { executablePath } from "puppeteer";
import { exec } from "child_process";
import * as fs from "fs";

// Define a request listener function for video downloading
const requestListener = (interceptedRequest) => {
  // Get the requested URL
  const requestUrl = interceptedRequest.url();
  // Check if the requested URL ends with .m3u8
  if (requestUrl.endsWith(".m3u8")) {
    // Output the request URL and request method
    console.log("Request URL:", requestUrl);
    console.log(
      "interceptedRequest.frame():",
      interceptedRequest.frame().url()
    );

    // Extract the part ending with /lessons/ as the file name
    // Get the current page's URL
    const currentUrl = interceptedRequest.frame().url();
    // Extract the filename from the current page's URL
    const fileName = currentUrl
      .substring(currentUrl.lastIndexOf("/lessons/") + "/lessons/".length)
      .replace(/[^a-zA-Z0-9-]/g, "_");

    // ffmpeg command to execute
    const command = `ffmpeg -i "${requestUrl}" -codec copy ./data/${fileName}.mkv`;

    // Execute ffmpeg command using exec function
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });

    interceptedRequest.abort();
    return;
  }
  // Continue the request
  interceptedRequest.continue();
};

// Define the scraper function
const scraper = async (target) => {
  // Ensure the 'data' directory exists
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data");
  }

  const browser = await puppeteer.launch({
    // headless: false,
    executablePath: executablePath(),
  });

  const page = await browser.newPage();

  await page.goto("https://neptune.thinkific.com/users/sign_in", {
    waitUntil: "networkidle0",
  });

  await page.type(target.username.selector, target.username.value);

  await page.type(target.password.selector, target.password.value);

  await page.click(target.buttonSelector);

  await page.goto(target.url, { waitUntil: "networkidle0" });

  const html = await page.content();

  // Use page.evaluate method to execute JavaScript code and extract href attribute values
  const hrefs = await page.evaluate(() => {
    const hrefsArray = [];
    // Selector specifies the elements whose href attributes are to be extracted
    const elements = document.querySelectorAll(
      ".course-player__left-drawer._left-drawer_n1vbpj a"
    );
    elements.forEach((element) => {
      // Add the href attribute value of each element to the array
      hrefsArray.push(element.href);
    });
    return hrefsArray;
  });

  console.log(hrefs); // Output the extracted href values array
  fs.writeFileSync("hrefs.txt", JSON.stringify(hrefs));

  // Iterate over the obtained links
  for (const href of hrefs) {
    // Check if the link contains a specific format of substring
    if (
      href.includes(
        "https://neptune.thinkific.com/courses/take/open-edition-developer-training-foundation-2024/texts/"
      )
    ) {
      // Visit the page corresponding to the link and extract HTML content
      const newPage = await browser.newPage();
      await newPage.goto(href, { waitUntil: "networkidle0" });
      const htmlContent = await newPage.evaluate(() => {
        // Return the HTML content of the page with div class fr-view
        const divContent = document.querySelector("div.fr-view");
        return divContent ? divContent.innerHTML : null;
      });

      if (htmlContent) {
        // Extract the filename from the link
        const fileName = href
          .substring(href.lastIndexOf("/texts/") + "/texts/".length)
          .replace(/[^a-zA-Z0-9-]/g, "_");

        // Write HTML content to a text file
        fs.writeFileSync(`./data/${fileName}.txt`, htmlContent);

        console.log(`HTML content saved to ${fileName}.txt`);
      } else {
        console.log(`No HTML content found for ${href}`);
      }

      // Save HTML content to file or elsewhere here
      // Just simple output here, you can modify as needed
      console.log(href);
      console.log(htmlContent);

      await newPage.close(); // Close the new page
    }

    if (
      href.includes(
        "https://neptune.thinkific.com/courses/take/open-edition-developer-training-foundation-2024/lessons/"
      )
    ) {
      // Enable request interception
      await page.setRequestInterception(true);

      // Listen for request events
      page.on("request", requestListener);

      // Open the page
      await page.goto(href, { waitUntil: "networkidle0" });

      // Remove listener at some point
      page.off("request", requestListener);
    }
  }

  await browser.close();
};

const TARGET = {
  url: "https://neptune.thinkific.com/courses/take/open-edition-developer-training-foundation-2024/texts/54722583-introduction",

  username: {
    selector: 'input[id="user[email]"]',

    value: "",
  },

  password: {
    selector: 'input[id="user[password]"]',

    value: "",
  },

  buttonSelector: 'input[id="sign-in"]',
};

fs.appendFileSync("log.txt", `Start Time: ${new Date().toLocaleString()}\n`);
await scraper(TARGET);
fs.appendFileSync("log.txt", `End Time: ${new Date().toLocaleString()}\n`);
