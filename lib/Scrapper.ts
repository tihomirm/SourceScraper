import normalizeUrl = require('normalize-url');
import objectMerge = require('object-merge');
import urlparser = require('urlparser');

import { Info } from './Info';
import { Runner } from './Runner';
import { Scrap } from './Scrap';

import { config } from './config';
import { runners } from './runners';

export type ScrapperExec = (args: any) => Info | Promise<Info | null> | null;

const _private = new WeakMap();

export class Scrapper {
    public name: string;
    public runner?: Runner;
    public runnerOptions?: object;
    public exec: ScrapperExec;

    constructor({ name, type, domain, runner, runnerOptions= {}, exec }: // tslint:disable-next-line
                    { name: string, type: string, domain?: string | string[], runner: Runner | string, runnerOptions?: any, exec: ScrapperExec }) {
        this.name = name;
        if (typeof runner === 'string') {
            this.setRunnerByType(runner);
        } else { this.runner = runner; }
        this.runnerOptions = runnerOptions;
        this.exec = exec;
        this.type = type;
        this.domain = typeof domain === 'undefined' ? [] : Array.isArray(domain) ? domain : [domain];
    }

    get type(): string {
        return _private.get(this).type;
    }
    set type(value: string) {
        (_private.get(this) || _private.set(this, {}).get(this)).type = value.toLowerCase();
    }
    get domain(): string[] {
        return _private.get(this).domain;
    }
    set domain(value: string[]) {
        (_private.get(this) || _private.set(this, {}).get(this)).domain = value;
    }

    public setRunnerByType(type: string): void {
        const runner = runners.getByType(type);
        if (typeof runner === 'undefined') {
            throw new TypeError('Runner not supported');
        }
        this.runner = runner;
    }
    public isApplicable(url: string): boolean {
        url = normalizeUrl(url);
        const u = urlparser.parse(url);
        return this.domain.some((d) => u.host.hostname.includes(d));
    }
    public async run(url: string): Promise<Scrap> {
        let info: Info | null;
        try {
            info = await (typeof this.runner === 'undefined' ? this.exec : this.runner.run)({
                url,
                scrapper: this.exec,
                options: this.runnerOptions
            });
        } catch (err) {
            if (config.showError) {
                console.error(err);
            }
            info = null;
        }
        return new Scrap({
            info,
            url,
            scrapper: this
        });
    }
    public toJSON(): object {
        return objectMerge(this, _private.get(this));
    }
}