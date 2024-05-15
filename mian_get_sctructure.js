import puppeteer, { executablePath } from "puppeteer";
import * as fs from "fs";

const scraper = async (target) => {
  const browser = await puppeteer.launch({
    //    headless: false,

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

  await browser.close();

  return html;
};

const TARGET = {
  url: "https://neptune.thinkific.com/api/course_player/v2/courses/open-edition-developer-training-foundation-2024",

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

// console.log(await scraper(TARGET))
fs.writeFileSync(
  "open-edition-developer-training-foundation-2024.html",
  await scraper(TARGET)
);
