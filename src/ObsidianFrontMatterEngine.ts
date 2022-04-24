import { MetadataCache, TFile, Vault } from "obsidian";

export interface IFrontMatterEngine {
    set(key: string, value: string | boolean | number): IFrontMatterEngine;
    get(key: string): string | boolean | number;
    apply(): Promise<void>;
}

export default class ObsidianFrontMatterEngine implements IFrontMatterEngine {

    metadataCache: MetadataCache;
    file: TFile;
    vault: Vault;

    generatedFrontMatter: object = {};

    constructor(vault: Vault, metadataCache: MetadataCache, file: TFile) {
        this.metadataCache = metadataCache;
        this.vault = vault;
        this.file = file;
    }

    set(key: string, value: string | boolean | number): ObsidianFrontMatterEngine {
        //@ts-ignore
        this.generatedFrontMatter[key] = value;
        return this;
    }

    get(key: string): string | boolean | number {
        //@ts-ignore
        return this.getFrontMatterSnapshot()[key];
    }

    async apply(): Promise<void> {
        const newFrontMatter = this.getFrontMatterSnapshot();

        const content = await this.vault.cachedRead(this.file);
        const frontmatterRegex = /^\s*?---\n([\s\S]*?)\n---/g;
        const yaml = this.frontMatterToYaml(newFrontMatter);
        let newContent = "";
        if (content.match(frontmatterRegex)) {
            newContent = content.replace(frontmatterRegex, (match) => {
                return yaml;
            });
        } else {
            newContent = `${yaml}\n${content}`;
        }

        await this.vault.modify(this.file, newContent);
    }

    private frontMatterToYaml(frontMatter: {}) {
        let yaml = "---\n";
        for (const key of Object.keys(frontMatter)) {
            //@ts-ignore
            yaml += `${key}: ${frontMatter[key]}\n`;
        }
        yaml += "---";
        return yaml;

    }

    private getFrontMatterSnapshot() {
        const cachedFrontMatter = { ...this.metadataCache.getCache(this.file?.path)?.frontmatter };
        delete cachedFrontMatter["position"];

        return { ...cachedFrontMatter, ...this.generatedFrontMatter };
    }


}
