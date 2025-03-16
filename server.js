// 定义目标API地址
const TARGET_URL = 'https://generativelanguage.googleapis.com';

// 主事件监听器
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * 处理并转发请求到目标API
 * @param {Request} request - 原始请求对象
 * @returns {Response} 从目标API返回的响应或错误响应
 */
async function handleRequest(request) {
  try {
    // 解析请求URL
    const requestUrl = new URL(request.url);
    const path = requestUrl.pathname + requestUrl.search;
    
    // 构建转发URL
    const forwardUrl = new URL(path, TARGET_URL);
    
    // 提取请求方法和准备请求体
    const method = request.method;
    let requestBody = null;
    
    // 如果是包含数据的请求，尝试解析请求体
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        // 克隆请求以避免消耗原始请求流
        const requestClone = request.clone();
        const contentType = request.headers.get('Content-Type') || '';
        
        if (contentType.includes('application/json')) {
          requestBody = await requestClone.json();
        } else {
          requestBody = await requestClone.text();
        }
      } catch (error) {
        // 如果无法解析请求体，继续处理请求
        console.error('Failed to parse request body:', error);
      }
    }
    
    // 创建干净的头信息，只包含必要的头
    const cleanHeaders = new Headers();
    
    // 设置内容类型
    const contentType = request.headers.get('Content-Type');
    if (contentType) {
      cleanHeaders.set('Content-Type', contentType);
    }
    
    // 转发授权信息，如果有的话
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      cleanHeaders.set('Authorization', authHeader);
    }
    
    // 可以添加自定义API密钥，如果需要的话
    // cleanHeaders.set('x-goog-api-key', 'YOUR_API_KEY');
    
    // 设置接受的响应类型
    cleanHeaders.set('Accept', 'application/json');
    
    // 创建转发请求
    const forwardRequest = new Request(forwardUrl.toString(), {
      method: method,
      headers: cleanHeaders,
      body: requestBody ? (typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)) : null,
      redirect: 'follow'
    });
    
    // 发送请求到目标API
    const response = await fetch(forwardRequest);
    
    // 创建干净的响应头
    const cleanResponseHeaders = new Headers();
    
    // 复制必要的响应头
    const headersToKeep = [
      'content-type',
      'cache-control',
      'etag',
      'vary'
    ];
    
    for (const header of headersToKeep) {
      const value = response.headers.get(header);
      if (value) {
        cleanResponseHeaders.set(header, value);
      }
    }
    
    // 允许CORS，使其可以从任何源调用
    cleanResponseHeaders.set('Access-Control-Allow-Origin', '*');
    cleanResponseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    cleanResponseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 显式删除任何安全相关的头信息
    const securityHeaders = [
      'content-security-policy',
      'x-content-security-policy',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    for (const header of securityHeaders) {
      cleanResponseHeaders.delete(header);
    }
    
    // 返回响应，带有干净的头信息
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: cleanResponseHeaders
    });
  } catch (error) {
    // 处理任何错误并返回适当的响应
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({
      error: 'Proxy Error',
      message: error.message || 'An error occurred while processing your request'
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 处理OPTIONS请求（预检请求）
function handleOptions(request) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  });
  
  return new Response(null, {
    status: 204,
    headers
  });
}
