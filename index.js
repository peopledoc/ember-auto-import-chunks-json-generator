'use strict';

// eslint-disable-next-line node/no-extraneous-require
const { MergeTrees } = require('broccoli-merge-trees');
// eslint-disable-next-line node/no-extraneous-require
const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');

class ChunksWriter extends Plugin {
  constructor(inputNodes, options = {}) {
    super(inputNodes, {
      annotation: options.annotation,
      // see `options` in the below README to see a full list of constructor options
    });
    this.inserter = options.inserter;
  }

  build() {
    const content = JSON.stringify(this.inserter.categorizeChunks(), null, 2);
    fs.writeFileSync(
      path.join(this.outputPath, 'chunks.json'),
      content,
      'utf8'
    );
  }
}

module.exports = {
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  },

  postprocessTree(which, tree) {
    if (which === 'all') {
      if (tree._annotation === 'ember-auto-import-analyzer') {
        // running in dev mode, don't need to generate chunks.json
        return tree;
      }
      if (!tree.inputNodes) {
        throw new Error(
          'Unknown build tree configuration, this addon should follow exactly after ember-auto-import'
        );
      }
      const inserter = tree.inputNodes.find(
        (node) => node._name === 'Inserter'
      );
      const chunkWriterInstance = new ChunksWriter(['app'], { inserter });
      return new MergeTrees([tree, chunkWriterInstance]);
    }
    return tree;
  },
};
