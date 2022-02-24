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
    } else if (this.opts.browser.toLowerCase() === 'safari') {
      convertV3ToV2(manifestBase);
    }
    const output = this.opts.pretty ? JSON.stringify(manifestBase, null, 2) : JSON.stringify(manifestBase);
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

function convertV3ToV2(conf) {
  conf.manifest_version = 2;
  conf.web_accessible_resources = conf.web_accessible_resources[0].resources;
  conf.background = {
    scripts: [conf.background.service_worker],
    persistent: false,
  };
  conf.browser_action = conf.action;
  delete conf.action;
}

module.exports = BuildManifestPlugin;
