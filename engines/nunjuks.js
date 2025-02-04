import nunjucks from "../deps/nunjuks.js";
import TemplateEngine from "./templateEngine.js";

export default class Denjuks extends TemplateEngine {
  cache = new Map();

  constructor(site, options = {}) {
    super(site, options);

    const loader = new nunjucks.FileSystemLoader(this.includes);
    this.engine = new nunjucks.Environment(loader);

    //Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const file of ev.files) {
        const filename = site.src(file);
        const name = loader.pathsToNames[filename];

        if (name) {
          delete loader.cache[name];
          continue;
        }

        this.cache.delete(filename);
      }
    });
  }

  async render(content, data, filename) {
    if (!this.cache.has(filename)) {
      this.cache.set(
        filename,
        nunjucks.compile(content, this.engine, filename),
      );
    }

    return new Promise((resolve, reject) => {
      this.cache.get(filename).render(data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  addFilter(name, fn, async) {
    if (async) {
      this.engine.addFilter(name, async (...args) => {
        const cb = args.pop();
        try {
          const result = await fn(...args);
          cb(null, result);
        } catch (err) {
          cb(err);
        }
      }, true);
      return;
    }

    this.engine.addFilter(name, fn);
  }
}
