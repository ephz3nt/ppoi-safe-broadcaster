/*
  Top-level Controllers library. This aggregates the other controller libraries
  and presents a single Class library for all controllers. This is in-line with
  the Clean Architecture design pattern:
  https://troutsblog.com/blog/clean-architecture
*/

// Local libraries
const JSONRPC = require("./json-rpc");

class Controllers {
  constructor(localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters;
    if (!this.adapters) {
      throw new Error(
        "Instance of Adapters library required when instantiating Controllers."
      );
    }
  }

  // Add the JSON RPC router to the ipfs-coord adapter.
  attachRPCControllers() {
    // Instantiate here rather than constructor, after adapters have initialized.
    this.jsonRpc = new JSONRPC({ adapters: this.adapters });

    // Attach the input of the JSON RPC router to the output of ipfs-coord.
    this.adapters.ipfs.ipfsCoordAdapter.attachRPCRouter(this.jsonRpc.router);
  }
}

module.exports = Controllers;