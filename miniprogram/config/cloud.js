"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOUD_CONFIG = void 0;
exports.isCloudConfigured = isCloudConfigured;
/**
 * 微信云托管的公开连接信息，不应在此文件保存 AppSecret、数据库密码等密钥。
 * 请在发布前填写云开发环境 ID 与云托管服务名称。
 */
exports.CLOUD_CONFIG = {
    envId: 'prod-d2g6h6rfk0d8b0ee5',
    serviceName: 'express-9l6u',
    timeout: 10000
};
function isCloudConfigured() {
    return Boolean(exports.CLOUD_CONFIG.envId.trim() && exports.CLOUD_CONFIG.serviceName.trim());
}
