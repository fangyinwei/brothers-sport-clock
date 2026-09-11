"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = getApi;
const mock_api_1 = require("./mock-api");
const cloud_api_1 = require("./cloud-api");
let api = null;
function getApi() {
    if (!api) {
        const explicitMode = wx.getStorageSync('brofit:api-mode');
        api = explicitMode === 'mock' ? (0, mock_api_1.createMockApi)() : (0, cloud_api_1.createCloudApi)();
    }
    return api;
}
