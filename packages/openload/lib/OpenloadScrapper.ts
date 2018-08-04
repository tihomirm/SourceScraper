import { ISourceData, Scrap, Source, SourceRunnerScrapper } from 'sourcescrapper-core';
import { IPuppeteerRunnerArgs, PuppeteerRunner } from 'sourcescrapper-puppeteer-runner';

export interface IOpenloadSourceData extends ISourceData {
    streamurl: string;
}

export class OpenloadScrapper extends SourceRunnerScrapper<IOpenloadSourceData> {
    public static Name: string = 'openload';
    public static Domains: string[] = ['openload.co', 'oload.tv', 'oload.win'];
    public static UrlPattern: RegExp = /https?:\/\/(www\.)?(openload\.co|oload\.(?:tv|win))\/embed\/(\w+)/i;
    public static Runner: PuppeteerRunner<IOpenloadSourceData> = new PuppeteerRunner<IOpenloadSourceData>();
    public static async scrap(url: string): Promise<Scrap<IOpenloadSourceData>> {
        return new OpenloadScrapper().scrap(url);
    }
    public static async scrapFromArgs(url: string, args: IPuppeteerRunnerArgs): Promise<Scrap<IOpenloadSourceData>> {
        return new OpenloadScrapper().scrapFromArgs(url, args);
    }
    public name: string = OpenloadScrapper.Name;
    public domains: string[] = OpenloadScrapper.Domains;
    public urlPattern: RegExp = OpenloadScrapper.UrlPattern;
    public runner: PuppeteerRunner<IOpenloadSourceData> = OpenloadScrapper.Runner;
    protected async runWithArgs({ page }: IPuppeteerRunnerArgs): Promise<IOpenloadSourceData> {
        const streamurl = await page.$eval(
            '[id*=stream], div[style*="display:none"] p:last-of-type',
            e => e.innerHTML);
        const title = await page.$eval(
            'meta[name="description"], meta[name="og:title"], meta[name="twitter:title"]',
            e => e.innerHTML).catch(() => undefined);
        const thumb = await page.$eval(
            'meta[name="og:image"], meta[name="twitter:image"]',
            e => e.innerHTML).catch(() => undefined);
        return {
            sources: [new Source({
                url: `https://openload.co/stream/${await streamurl}?mime=true`
            })],
            title,
            poster: thumb,
            streamurl
        };
    }
}
