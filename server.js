const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 设置反向代理
const apiProxy = createProxyMiddleware({
  target: 'https://generativelanguage.googleapis.com', // 目标域名
  changeOrigin: true, // 修改请求头中的 Origin 为目标域名
  onProxyReq: (proxyReq, req, res) => {
    // 移除所有隐私相关的请求头
    const privacyHeaders = [
      'x-forwarded-for', // 客户端 IP
      'x-real-ip', // 客户端真实 IP
      'cf-connecting-ip', // Cloudflare 客户端 IP
      'true-client-ip', // 客户端真实 IP
      'forwarded', // 代理链信息
      'via', // 代理链信息
      'x-cluster-client-ip', // 集群客户端 IP
      'x-forwarded-host', // 原始主机信息
      'x-forwarded-proto', // 原始协议信息
      'x-originating-ip', // 原始 IP
      'x-remote-ip', // 远程 IP
      'x-remote-addr', // 远程地址
      'x-envoy-external-address', // Envoy 外部地址
      'x-amzn-trace-id', // AWS 跟踪 ID
      'x-request-id', // 请求 ID
      'x-correlation-id', // 关联 ID
    ];
    privacyHeaders.forEach((header) => proxyReq.removeHeader(header));
  },
  onProxyRes: (proxyRes, req, res) => {
    // 移除所有隐私相关的响应头
    const privacyHeaders = [
      'x-powered-by', // 服务器技术信息
      'server', // 服务器信息
      'x-request-id', // 请求 ID
      'x-correlation-id', // 关联 ID
      'x-amzn-trace-id', // AWS 跟踪 ID
      'via', // 代理链信息
      'cf-ray', // Cloudflare 信息
      'x-envoy-upstream-service-time', // Envoy 上游服务时间
    ];
    privacyHeaders.forEach((header) => delete proxyRes.headers[header]);
  },
});

// 使用反向代理中间件
app.use('/', apiProxy); // 直接代理根路径

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
