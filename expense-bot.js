import puppeteer from "puppeteer";
import * as helpers from './services/helpers.js'
import * as dotenv from 'dotenv'
//not sure if this helped typing from terminal
//defaults write org.chromium.Chromium AutoSelectCertificateForUrls -array-add -string '{"pattern":"[*.]example.com","filter":{}}'
dotenv.config()

//use chrome native to comp and profile so that you don't have to accept certificates / authenticate
const browser = await puppeteer.launch({
  headless: false,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  userDataDir:
    "/Users/kogail01/Library/Application Support/Google/Chrome/Profile",
});
const batchDate = new Date();
///////// VERIZON ////////////////

const verizonUrl = process.env.VERIZON_URL ? process.env.VERIZON_URL :''; 
const verizoniFrameSelector = "iframe#DOMWindowIframe";
const usernameSelector = "#IDToken1";
const passwordSelector = "#IDToken2";
const signInBtnSelector = "#login-submit";
const paymentHistorySelector = ".panel-heading.card-header";

const verizonPage = await browser.newPage();
verizonPage.goto(verizonUrl);

await helpers.waitForTimeout(4000);
// const client = await verizonPage.target().createCDPSession();
// await client.send("Network.clearBrowserCookies");
// await client.send("Network.clearBrowserCache");

// const cookies = await verizonPage.cookies();
// console.log(cookies);
// verizonPage.reload();
// await waitForTimeout(2000);

//  cookies.forEach((cookie) => {

//   verizonPage.deleteCookie({
//     cookie.name : cookie.value
//   });
// });

const verizonFrame = await helpers.getIframe(verizoniFrameSelector, verizonPage);

await helpers.type(usernameSelector, '', verizonFrame);
await helpers.type(usernameSelector, process.env.VERIZON_USER ? process.env.VERIZON_USER :'', verizonFrame);
console.log("username typed..");

await helpers.type(passwordSelector,process.env.VERIZON_PASS ? process.env.VERIZON_PASS :'', verizonFrame);
console.log("password typed..");

// await helpers.click(signInBtnSelector, verizonFrame);
// console.log("signed in clicked..");

await helpers.click(paymentHistorySelector, verizonPage);
console.log("panel in clicked..");

await verizonPage.screenshot({
  path: `./verizon_ss_${batchDate.toISOString()}.png`,
  fullPage: true,
});



///////PEOPLE SOFT ////////////////

const page = await browser.newPage();
const targetContentFrame = 'TargetContent'

//getting to expense page logic
//people soft related links/selectors
const peopleSoftUrl = process.env.PEOPLESOFT_URL ? process.env.PEOPLESOFT_URL :'';
const peopleSoftUserIdSelector = "#userid";
const peopleSoftPassSelector = "#pwd";
const peopleSoftSubmitSelector = 'input[name="Submit"]';
const addBtnSelector = 'a[class="PSPUSHBUTTON Left PSPRIMARY"]';
const peopleSoftiMainFrameSelector = "iframe#ptifrmtgtframe";

// page.on('dialog', async dialog => {
//     await dialog.accept();
//   });

await page.goto(peopleSoftUrl);

//// LOGIN LOGIC AND GET TO EXPENSE PAGE LOGIC ////

await helpers.type(peopleSoftUserIdSelector, process.env.PEOPLESOFT_USER ? process.env.PEOPLESOFT_USER :'', page);
console.log("typed user..");

await helpers.type(peopleSoftPassSelector, process.env.PEOPLESOFT_PASS ? process.env.PEOPLESOFT_PASS : '', page);
console.log("typed password..");

await helpers.click(peopleSoftSubmitSelector, page);
console.log("clicked login..");

await helpers.click('a[title="Travel & Expense"]', page);
await helpers.waitForTimeout(2000)
console.log("clicked travel and expense..");

await helpers.focusClick('a[title="Create an Expense Report"]', page);
console.log("navigating to create an expense report..");
await helpers.waitForTimeout(1000)


const navigatedPage = await helpers.getNavigatedPage(await browser.pages());
const elementHandle = await navigatedPage.waitForSelector(
  peopleSoftiMainFrameSelector
);
const frame = await elementHandle.contentFrame();

const addButton = await frame.waitForSelector(addBtnSelector);
addButton.click();
console.log("clicked add..");
await helpers.waitForTimeout(2000);


///SELECT EXISTING REPORT LOGIC////

await helpers.click('select[name="EX_ICLIENT_WRK_START_DROPDOWN"]',frame)
console.log("clicked select..")

await navigatedPage.keyboard.type('An Existing Report')
await navigatedPage.keyboard.press('Enter')
console.log("selected existing report..")

const refreshExpensePage = await helpers.getNavigatedPage(await browser.pages());

 const theFrame = await refreshExpensePage.frames().find((frame)=>{
  console.log(frame._name)
  return frame._name === targetContentFrame
 })

await helpers.waitForTimeout(2000)
await helpers.click('input[name="EX_ICLIENT_WRK_GO_PB2"]',theFrame)
console.log("clicked GO..")


 const expenseFrame = await refreshExpensePage.frames().find((frame)=>{
  console.log(frame._name)
  return frame._name === 'ptModFrame_0'
 })
 await helpers.waitForTimeout(2000)

await helpers.click('a[class="PSPUSHBUTTON Left"]',expenseFrame)
console.log("clicked select on expense sheet..")

// SELECT NEW DATE LOGIC ////

await helpers.waitForTimeout(1000)
await helpers.click('a[id="TRANS_DATE$prompt$0"]',theFrame) 
console.log("clicked date calendar..")


const currPage = await helpers.getNavigatedPage(await browser.pages());
const currFrame = await currPage.frames().find((frame)=>{
  console.log(frame._name)
  return frame._name === targetContentFrame
 });
await helpers.waitForTimeout(1000)
const todaysDay = batchDate.toISOString().substring(8,10)
const [element] = await currFrame.$x(`//a[contains(text(), "${todaysDay}")]`);
element.click()
await element.focus();
console.log(`clicked specific date..${todaysDay}`)



//// FILE UPLOAD LOGIC //////

const attachmentUploadSelector = 'a[name="EX_HDR_WRK_ATTACHMENTS_PB"]';
const navigatedPage3 = await helpers.getNavigatedPage(await browser.pages());
const elementHandle2 = await navigatedPage3.waitForSelector(
  peopleSoftiMainFrameSelector
);
const frame2 = await elementHandle2.contentFrame();
await helpers.waitForTimeout(2000);
//console.log(frame2)

const [fileChooser] = await Promise.all([
  navigatedPage3.waitForFileChooser(),
  helpers.waitForTimeout(1000),
  helpers.click(attachmentUploadSelector, frame2),
  helpers.waitForTimeout(3000),
  uploadFilePeopleSoft(await helpers.getNavigatedPage(await browser.pages())),
  helpers.waitForTimeout(1000),
]);
console.log("done choosing file")
await fileChooser.accept([`./verizon_ss_${batchDate.toISOString()}.png`]); //change to date
await helpers.waitForTimeout(2000)

///

const getPage2 = await helpers.getNavigatedPage(await browser.pages())
const theFrame2 = await getPage2.frames()[await getPage2.frames().length-1]

const uploadBtnSelector = '.PSPUSHBUTTON';
await helpers.click(uploadBtnSelector, theFrame2)
console.log("clicked upload..")
await helpers.waitForTimeout(1000)


const getPage = await helpers.getNavigatedPage(await browser.pages())
const theFrame3 = await getPage.frames()[await getPage.frames().length-1]

// await getPage.frames().find((frame)=>{
//  return frame._name === 'ptModFrame_0'
// })
await helpers.click('input[id="#ICSave"]', theFrame3)
console.log('clicked ok...')



await helpers.waitForTimeout(1000)

//create the first one then you can use it as a template and just override the attachment!
async function uploadFilePeopleSoft(page) {
  const secondaryAttachUpSelector = ' input[name="ATT_PNLS_WRK_ATTACHADD"]';
  const chooseFileSelector = 'input[name="#ICOrigFileName"]'
  const elementHandle2 = await page.waitForSelector('#ptModFrame_1');
  const frame = await page.frames()[await page.frames().length-1];

  await helpers.click(secondaryAttachUpSelector, frame)
  await helpers.waitForTimeout(1000)
  console.log("clicked secondary attachment")
   const getPage =  await helpers.getNavigatedPage(await browser.pages());

  const elementHandle3 = await getPage.waitForSelector('#ptModFrame_1', {
    visible: true,
  })
  const frame2 =  await getPage.frames()[await getPage.frames().length-1];


  await helpers.click(chooseFileSelector, frame2)
  await helpers.waitForTimeout(1000)
  console.log("clicked choose file")
}

