'use strict';

const { MergeTrees } = require('broccoli-merge-trees');
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
        // likely running in dev mode, don't need to generate chunks.json
        return tree;
      }
      let inputNodes =
        tree.inputNodes || (tree.inputTree && tree.inputTree.inputNodes);
      if (!inputNodes) {
        console.error(tree);
        throw new Error(
          'Unknown build tree configuration, this addon should follow exactly after ember-auto-import'
        );
      }
      const inserter = inputNodes.find((node) => node._name === 'Inserter');
      if (!inserter) {
        console.error(tree);
        throw new Error(
          'Unable to find Inserter instance in emebr-auto-import build tree'
        );
      }
      const chunkWriterInstance = new ChunksWriter(['app'], { inserter });
      return new MergeTrees([tree, chunkWriterInstance]);
    }
    return tree;
  },
};
