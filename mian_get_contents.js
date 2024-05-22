import puppeteer, { executablePath } from "puppeteer";
import { exec } from "child_process";
import * as fs from "fs";
import { parse } from "json2csv";

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

    // Call Python script to transcribe audio
    const command = `ffmpeg -i "${requestUrl}" -codec copy ./data/${fileName}.mkv && python transcribe_video.py ./data/${fileName}.mkv`;

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

const scraper = async (target) => {
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

  await page.goto(target.url, { timeout: 120000, waitUntil: "networkidle0" });

  const chaptersData = await page.evaluate(() => {
    const chapters = [];
    const chapterElements = document.querySelectorAll(
      "div.course-player__chapters-item._chapters-item_1tqvoe.ember-view.ui-accordion.ui-widget.ui-helper-reset"
    );
    chapterElements.forEach((chapterElement) => {
      const chapterName = chapterElement.querySelector(
        "h2._chapter-item__title_d57kmg"
      ).innerText;
      const lessons = [];
      const lessonElements = chapterElement.querySelectorAll(
        "a.course-player__content-item__link._content-item__link_nffvg8.ember-view"
        // "li.course-player__content-item.released.content-item__progress--viewed._content-item_nffvg8 a.course-player__content-item__link._content-item__link_nffvg8.ember-view"
      );
      lessonElements.forEach((lessonElement) => {
        const lessonName = lessonElement.innerText;
        const lessonUrl = lessonElement.href;
        lessons.push({ lessonName, lessonUrl });
      });
      chapters.push({ chapterName, lessons });
    });
    return chapters;
  });

  console.log("chaptersData", chaptersData);

  const records = [];

  for (const chapter of chaptersData) {
    for (const lesson of chapter.lessons) {
      const href = lesson.lessonUrl;
      let sourceType = "text";

      if (href.includes("/texts/")) {
        const newPage = await browser.newPage();
        await newPage.goto(href, {
          timeout: 120000,
          waitUntil: "networkidle0",
        });
        const htmlContent = await newPage.evaluate(() => {
          const divContent = document.querySelector("div.fr-view");
          // return divContent ? divContent.innerHTML : null;
          return divContent ? divContent.innerText : null;
        });

        if (htmlContent) {
          const fileName = href
            .substring(href.lastIndexOf("/texts/") + "/texts/".length)
            .replace(/[^a-zA-Z0-9-]/g, "_");

          fs.writeFileSync(`./data/${fileName}.txt`, htmlContent);
          records.push({
            chapterName: chapter.chapterName,
            lessonTitle: fileName,
            sourceUrl: href,
            sourceType: "text",
            content: htmlContent,
          });
        }

        await newPage.close();
      }

      if (href.includes("/lessons/")) {
        console.log(href);
        await page.setRequestInterception(true);
        page.on("request", requestListener);
        await page.goto(href, { timeout: 120000, waitUntil: "networkidle0" });
        page.off("request", requestListener);
        sourceType = "video";
        const fileName = href
          .substring(href.lastIndexOf("/lessons/") + "/lessons/".length)
          .replace(/[^a-zA-Z0-9-]/g, "_");
        records.push({
          chapterName: chapter.chapterName,
          lessonTitle: fileName,
          sourceUrl: href,
          sourceType: "video",
          content: fileName, // Save the transcribed text
        });
      }
    }
  }

  await browser.close();

  const jsonContent = JSON.stringify(records, null, 2);
  fs.writeFileSync("./data/records.json", jsonContent);

  const csvContent = parse(records);
  fs.writeFileSync("./data/records.csv", csvContent);

  console.log("Scraping completed and data saved.");
};

function readFileAsync(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function writeFileAsync(path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, "utf8", (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function updaterTranscriptonRecords() {
  try {
    const data = await readFileAsync("./data_Foundation/records.json");
    const records = JSON.parse(data);

    for (const record of records) {
      if (record.sourceType === "video") {
        const txtFilePath = `./data_Foundation/${record.lessonTitle}.txt`;

        try {
          const txtContent = await readFileAsync(txtFilePath);
          record.content = txtContent;
          console.log("Replaced content for:", record.lessonTitle);
        } catch (err) {
          console.error(`Error reading ${txtFilePath}:`, err);
        }
      }
    }

    await writeFileAsync(
      "./data_Foundation/records_updated.json",
      JSON.stringify(records, null, 2)
    );
    console.log("Content replacement completed.");

    const csvContent = parse(records);
    fs.writeFileSync("./data_Foundation/records.csv", csvContent);
  } catch (error) {
    console.error("Error:", error);
  }
}

const TARGET = {
  url: "https://neptune.thinkific.com/courses/take/open-edition-developer-training-advanced-2024/lessons/54922574-creating-your-own-templates-and-building-blocks",
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
updaterTranscriptonRecords();
fs.appendFileSync("log.txt", `End Time: ${new Date().toLocaleString()}\n`);
