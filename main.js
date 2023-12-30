import { chromium } from "playwright";
import { createObjectCsvWriter } from "csv-writer";

const base_url = "https://summerofcode.withgoogle.com";
const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  let global_orgs = [];

  for (const year of years) {
    const page = await context.newPage();
    let url = `${base_url}/archive/${year}/organizations`;
    await page.goto(url);

    let orgs = [
      { name: "", link: "" },
      { name: `project_name_${year}`, link: `project_link_${year}` },
    ];

    let next_btn = page.getByRole("button", { name: "Next page" });
    orgs.push(...(await getOrganizationDetails(page, base_url, year)));

    while (!(await next_btn.isDisabled())) {
      await next_btn.click();
      orgs.push(...(await getOrganizationDetails(page, base_url, year)));
    }

    global_orgs.push(...orgs);
  }
  writeToCSV(global_orgs);
  await context.close();
  await browser.close();
})();

async function getOrganizationDetails(page, base_url) {
  await page.waitForSelector("app-card > .card > a");
  const elems = await page.$$("app-card > .card > a");
  let orgs = [];
  for (let elem of elems) {
    let link = await elem.getAttribute("href");
    let name = (await elem.innerText()).split("\n")[0];
    orgs.push({
      name: name,
      link: `${base_url}${link}`,
    });
  }
  return orgs;
}

async function writeToCSV(global_orgs) {
  const filename = "final.csv";
  const csvWriter = createObjectCsvWriter({
    path: filename,
    header: [
      { id: "name", title: "Project Name" },
      { id: "link", title: "Project Link" },
    ],
  });

  await csvWriter.writeRecords(global_orgs);

  console.log("results written successfully :-)");
}
