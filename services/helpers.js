async function waitForTimeout(milliseconds) {
  return new Promise((r) => setTimeout(r, milliseconds));
}
async function focusClick(selector, page) {
  await page.focus(selector);
  await page.keyboard.type("\n");
  await waitForTimeout(2000);
}
async function click(selector, page) {
  const clickSelector = await page.waitForSelector(selector, {
    visible: true,
  });
  clickSelector.click();
  await waitForTimeout(2000);
}
async function type(selector, text, page) {
  const typeSelector = await page.waitForSelector(selector, {
    visible: true,
  });
  typeSelector.type(text, { delay: 10 });
  await waitForTimeout(1000);
}
async function getIframe(selector, page) {
  const iframeHandler = await page.waitForSelector(selector, {
    visible: true,
  });
  const frame = await iframeHandler.contentFrame();
  return frame;
}
async function getNavigatedPage(pages) {
  return pages[pages.length - 1];
}

export { waitForTimeout, click, focusClick, type, getIframe, getNavigatedPage };
