import {expect,test} from '@playwright/test';

test('framework meaning search joins chunk results to framework cards',async({page})=>{
  test.setTimeout(120_000);
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/evidence/frameworks');
  await page.getByRole('searchbox',{name:'Search traditions'}).fill('heart weighed against a feather');
  await page.getByRole('button',{name:'Vector Search',exact:true}).click();
  await expect(page.getByRole('button',{name:'Reset Meaning Mode',exact:true})).toBeVisible({timeout:90_000});
  const target=page.getByRole('link',{name:'Egyptian Mythology (Duat)',exact:true});
  await expect(target).toBeVisible();
  await expect(target).toHaveAttribute('href','/evidence/frameworks/egyptian-duat');
  const cards=page.locator('.hw-atlas-grid h3 a');
  const hrefs=await cards.evaluateAll(links=>links.map(link=>link.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(new Set(hrefs).size).toBe(hrefs.length);
  await page.getByRole('button',{name:'Ancient Near East (3)',exact:true}).click();
  await expect(target).toBeVisible();
  await target.click();
  await expect(page).toHaveURL(/\/evidence\/frameworks\/egyptian-duat$/);
  expect(errors).toEqual([]);
});

test('corpus objects cache immutably while the release manifest revalidates',async({request})=>{
  const response=await request.get('/semantic-corpora/manifest.json');
  expect(response.ok()).toBe(true);
  expect(response.headers()['cache-control']).toBe('public, max-age=0, must-revalidate');
  const manifest=await response.json();
  const object=await request.get(`/semantic-corpora/${manifest.corpora.early.rows.path}`);
  expect(object.ok()).toBe(true);
  expect(object.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
});

test('expanded edition meaning search links into the library', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/early/library');
  const libraryRail = page.getByRole('region', { name: 'Ask the expanded editions' });
  await expect(libraryRail.getByText(/Similarity is not evidence of historical dependence/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/early/search?q=the+creation+of+the+world');
  const rail = page.getByRole('region', { name: 'Ask the expanded editions' });
  await expect(rail.getByRole('searchbox', { name: 'Ask in your own words' })).toHaveValue('the creation of the world');
  await rail.getByRole('button', { name: 'Find passages', exact: true }).click();
  await expect(rail.locator('ol li')).toHaveCount(8, { timeout: 90_000 });
  const hrefs = await rail.locator('ol a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect(hrefs.every(href => href?.startsWith('/early/library/'))).toBe(true);
  expect(new Set(hrefs).size).toBe(hrefs.length);
  await rail.locator('ol a').first().click();
  await expect(page).toHaveURL(/\/early\/library\//);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  expect(errors).toEqual([]);
});

test('early search retries corrupt artifacts and returns one linked section per best excerpt',async({page})=>{
  test.setTimeout(120_000);
  const query='the smallest things coming from above have great power when they fall upon the earth';
  const errors:string[]=[],modelRequests:string[]=[],indexRequests:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{
    if(request.url().includes('/models/'))modelRequests.push(request.url());
    if(request.url().includes('/semantic-corpora/'))indexRequests.push(request.url());
  });
  await page.goto(`/early?ask=${encodeURIComponent(query)}`);
  const rail=page.getByRole('region',{name:'Ask the writings'});
  await expect(rail.getByRole('searchbox',{name:'Ask in your own words'})).toHaveValue(query);
  await expect(rail.getByText(/first meaning search downloads about 47 MB/)).toBeVisible();
  expect(modelRequests).toHaveLength(0);
  let corrupt=true;
  await page.route('**/semantic-corpora/objects/*.bin',async route=>{
    if(corrupt){corrupt=false;await route.fulfill({body:'corrupt generation'});}
    else await route.continue();
  });
  await rail.getByRole('button',{name:'Find passages',exact:true}).click();
  await expect(rail.getByRole('alert')).toBeVisible({timeout:90_000});
  await rail.getByRole('button',{name:'Find passages',exact:true}).click();
  const results=rail.locator('ol li');
  await expect(results).toHaveCount(8,{timeout:90_000});
  const target=rail.getByRole('link',{name:/The Shepherd of Hermas.*The Spirit and Prophets/});
  await expect(target).toHaveAttribute('href','/early/shepherd-hermas#s43');
  await expect(target).toContainText('Matched excerpt 4 of 4');
  const hrefs=await rail.locator('ol a').evaluateAll(links=>links.map(link=>link.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(hrefs.length);
  expect(indexRequests.some(url=>url.endsWith('/semantic-corpora/manifest.json'))).toBe(true);
  await target.click();
  await expect(page).toHaveURL(/\/early\/shepherd-hermas#s43$/);
  await expect(page.locator('#s43')).toBeAttached();
  expect(errors).toEqual([]);
});
