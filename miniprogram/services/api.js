"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = getApi;
const mock_api_1 = require("./mock-api");
let api = null;
function getApi() {
    if (!api)
        api = (0, mock_api_1.createMockApi)();
    return api;
}
