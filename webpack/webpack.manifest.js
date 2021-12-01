const fs = require('fs');
const path = require('path');
const validateOptions = require('schema-utils').validate;

const manifestBase = require('../manifest/manifest.json');
const edgeManifestExtra = require('../manifest/edge-manifest-extra.json');

// Schema for options
const schema = {
  type: 'object',
  properties: {
    browser: {
      type: 'string',
    },
    pretty: {
      type: 'boolean',
    },
  },
  additionalProperties: false,
};

/**
 * Plugin to build the manifest file in addition to the application code.
 * Inspired by: https://github.com/ajayyy/SponsorBlock/blob/master/webpack/webpack.manifest.js
 */
class BuildManifestPlugin {
  constructor(opts = {}) {
    validateOptions(schema, opts, { name: 'Build Manifest Plugin' });
    this.opts = opts;
  }

  apply(_compiler) {
    const distFolderPath = path.resolve(__dirname, '../dist/');
    const distManifestFilePath = path.resolve(distFolderPath, 'manifest.json');

    // Add additional manifest data
    if (this.opts.browser.toLowerCase() === 'edge') {
      mergeConfigs(manifestBase, edgeManifestExtra);
    }
    const output = this.opts.prettyPrint ? JSON.stringify(manifestBase, null, 2) : JSON.stringify(manifestBase);
    fs.mkdirSync(distFolderPath, { recursive: true });
    fs.writeFileSync(distManifestFilePath, output);
  }
}

// Note this mutates the original object!
function mergeConfigs(conf1, conf2) {
  for (const key in conf2) {
    if (Array.isArray(conf1[key])) {
      conf1[key] = conf1[key].concat(conf2[key]);
      continue;
    }
    if (typeof conf1[key] === 'object') {
      mergeConfigs(conf1[key], conf2[key]);
      continue;
    }
    conf1[key] = conf2[key];
  }
}

module.exports = BuildManifestPlugin;
