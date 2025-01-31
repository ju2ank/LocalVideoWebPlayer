import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:444'; // URL de la aplicación
const API_BASE_URL = 'https://192.168.1.7:446'; // URL de la API
// Tests de la interfaz de usuario
test.describe('Pruebas de la interfaz de usuario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL); // Navega a la aplicación antes de cada test
  });

  test('Carga inicial de videos', async ({ page }) => {
    const videosContainer = await page.locator('#videos-container');
    await expect(videosContainer).toBeVisible();

    const videoCards = await page.locator('.w-full.md\\:w-1\\/3.lg\\:w-1\\/3.px-2.mb-3');
    await expect(videoCards).toHaveCount(30); // Ajusta según tu paginación
  });

  test('Búsqueda de videos', async ({ page }) => {
    const searchInput = await page.locator('#filename-input');
    await searchInput.fill('video1'); // Cambia el término de búsqueda según tus datos
    await page.click('button:has-text("Buscar Videos")');

    const videoCards = await page.locator('.w-full.md\\:w-1\\/3.lg\\:w-1\\/3.px-2.mb-3');
    await expect(videoCards).toHaveCount(1); // Ajusta según el resultado esperado
  });

  test('Reproducción de video', async ({ page }) => {
    const firstVideo = await page.locator('video').first();
    const playPauseButton = await page.locator('.video-controls button:has-text("Play/Pause")').first();

    await playPauseButton.click();
    const isPlaying = await firstVideo.evaluate((video) => !video.paused);
    expect(isPlaying).toBeTruthy();

    await playPauseButton.click();
    const isPaused = await firstVideo.evaluate((video) => video.paused);
    expect(isPaused).toBeTruthy();
  });

  test('Paginación', async ({ page }) => {
    const nextButton = await page.locator('#nextPage');
    await nextButton.click();

    const currentPageInfo = await page.locator('#stats');
    await expect(currentPageInfo).toContainText('Página: 2'); // Ajusta según tu paginación

    const prevButton = await page.locator('#prevPage');
    await prevButton.click();
    await expect(currentPageInfo).toContainText('Página: 1');
  });

  test('Video aleatorio', async ({ page }) => {
    await page.click('button:has-text("Video Random")');

    const randomVideo = await page.locator('video');
    await expect(randomVideo).toBeVisible();

    const videoTitle = await page.locator('#videoPath');
    await expect(videoTitle).toBeVisible();
  });
});

// Tests de la API
test.describe('Pruebas de la API', () => {
  test('GET /VideoInfo/GetVideoList - Debe devolver una lista de videos', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/VideoInfo/GetVideoList`);
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(Array.isArray(responseBody)).toBeTruthy();

    if (responseBody.length > 0) {
      const firstVideo = responseBody[0];
      expect(firstVideo).toHaveProperty('path');
      expect(firstVideo).toHaveProperty('fileName'); // Ajusta según las propiedades de tu API
    }
  });

  test('GET /VideoInfo/GetRandomVideo - Debe devolver un video aleatorio', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/VideoInfo/GetRandomVideo`);
    /* expect(response.status()).toBe(200,206);
 */    expect([200, 206]).toContain(response.status())
    
    const responseBody = await response.text();
    expect(typeof responseBody).toBe('string');
    expect(responseBody).toMatch(/\.mp4$/); // Asegura que la ruta termine en .mp4
  });

  test('GET /VideoStream/GetStream/{videoPath} - Debe devolver el stream de un video', async ({ request }) => {
    const videoListResponse = await request.get(`${API_BASE_URL}/VideoInfo/GetVideoList`);
    const videoList = await videoListResponse.json();

    if (videoList.length > 0) {
      const videoPath = encodeURIComponent(videoList[0].path);
      const streamResponse = await request.get(`${API_BASE_URL}/VideoStream/GetStream/${videoPath}`);

/*       expect(streamResponse.status()).toBe(200); */
      expect([200, 206]).toContain(response.status());
    
      const contentType = streamResponse.headers()['content-type'];
      expect(contentType).toMatch(/video\/mp4/); // Ajusta según el tipo de contenido
    } else {
      console.warn('No hay videos disponibles para probar el endpoint de stream.');
    }
  });
});