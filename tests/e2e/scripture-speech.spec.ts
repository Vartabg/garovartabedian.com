import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    const voices = [
      {
        default: true,
        lang: "en-US",
        localService: true,
        name: "Ava (Enhanced)",
        voiceURI: "voice:ava",
      },
      {
        default: false,
        lang: "en-GB",
        localService: false,
        name: "Daniel",
        voiceURI: "voice:daniel",
      },
    ] as SpeechSynthesisVoice[];

    const synth = {
      addEventListener: () => {},
      cancel: () => {},
      getVoices: () => voices,
      pause: () => {},
      pending: false,
      paused: false,
      removeEventListener: () => {},
      resume: () => {},
      speak: () => {},
      speaking: false,
    };

    class MockAudio {
      currentTime = 0;
      playbackRate = 1;
      preload = "";
      readonly src: string;
      private listeners = new Map<string, Set<() => void>>();

      constructor(src: string) {
        this.src = src;
      }

      addEventListener(name: string, listener: () => void) {
        const listeners = this.listeners.get(name) ?? new Set();
        listeners.add(listener);
        this.listeners.set(name, listeners);
      }

      removeEventListener(name: string, listener: () => void) {
        this.listeners.get(name)?.delete(listener);
      }

      pause() {}

      play() {
        (
          window as typeof window & {
            __lastNarration?: { src: string; playbackRate: number };
          }
        ).__lastNarration = {
          src: this.src,
          playbackRate: this.playbackRate,
        };
        return Promise.resolve();
      }
    }

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: MockUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: synth,
    });
    Object.defineProperty(window, "Audio", {
      configurable: true,
      value: MockAudio,
    });
  });
});

test("offers free device narration with voice selection and preview", async ({
  page,
}) => {
  await page.goto("/scriptures/protestant/PSA/23?t=drb");

  const listen = page.getByRole("button", {
    name: "Listen — read this chapter aloud",
  });
  await expect(listen).toBeVisible();
  await listen.click();
  await expect(
    page.getByRole("button", { name: "Stop reading aloud" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Reading settings/ }).click();
  await expect(page.getByText("Narrator", { exact: true })).toBeVisible();

  const voice = page.getByLabel("Voice");
  await expect(voice).toHaveValue("auto");
  await expect(voice.locator("option")).toHaveText([
    "Automatic — best available",
    "Ava (Enhanced) · en-US",
    "Daniel · en-GB · online",
  ]);

  await page.getByRole("button", { name: "Preview voice" }).click();
  await expect(
    page.getByRole("button", { name: "Stop preview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop preview" }).click();
  await expect(
    page.getByRole("button", { name: "Preview voice" }),
  ).toBeVisible();
  await expect(page.getByText("No paid narration API is used.")).toBeVisible();
});

test("prefers authored elder narration when the chapter has it", async ({
  page,
}) => {
  await page.goto("/scriptures/protestant/PSA/23?t=kjv");

  await page
    .getByRole("button", { name: "Listen — read this chapter aloud" })
    .click();
  await expect(
    page.getByRole("button", { name: "Stop reading aloud" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __lastNarration?: { src: string; playbackRate: number };
            }
          ).__lastNarration,
      ),
    )
    .toEqual({
      src: "/scriptures/audio/kjv/PSA/23.m4a",
      playbackRate: 1,
    });

  await page.getByRole("button", { name: /Reading settings/ }).click();
  await expect(page.getByText("The Elder", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Authored narration is available for this translation and chapter."),
  ).toBeVisible();
  await expect(page.getByText("Fallback narrator", { exact: true })).toBeVisible();
  await expect(page.getByText("No paid narration API is used.")).toBeVisible();
});

test("uses authored narration on every landing-page Scripture path", async ({
  page,
}) => {
  const chapters = [
    ["PSA", 23],
    ["GEN", 1],
    ["MAT", 1],
    ["ROM", 8],
    ["PRO", 1],
  ] as const;

  for (const [book, chapter] of chapters) {
    const src = `/scriptures/audio/web/${book}/${chapter}.m4a`;
    const audioResponse = await page.request.get(src);
    expect(audioResponse.ok()).toBe(true);
    expect(audioResponse.headers()["content-type"]).toMatch(/^audio\//);
    expect((await audioResponse.body()).byteLength).toBeGreaterThan(100_000);

    await page.goto(`/scriptures/protestant/${book}/${chapter}`);
    await page
      .getByRole("button", { name: "Listen — read this chapter aloud" })
      .click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __lastNarration?: { src: string; playbackRate: number };
              }
            ).__lastNarration,
        ),
      )
      .toEqual({
        src,
        playbackRate: 1,
      });
  }
});
