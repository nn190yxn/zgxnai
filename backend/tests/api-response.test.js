const { sendSuccess, sendError } = require('../src/mysql-production/api-response');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return body;
    }
  };
}

describe('统一 API 响应结构', () => {
  it('成功响应包含请求标识和数据版本', () => {
    const res = createResponse();
    sendSuccess(res, { headers: { 'x-request-id': 'request-1' } }, { value: 1 });

    expect(res.body).toEqual(expect.objectContaining({ success: true, data: { value: 1 } }));
    expect(res.body.meta).toEqual(expect.objectContaining({ requestId: 'request-1', schemaVersion: 1, dataVersion: 1 }));
  });

  it('错误响应包含稳定错误代码和用户提示', () => {
    const res = createResponse();
    sendError(res, { headers: {} }, 400, 'CHILD_ID_REQUIRED', 'childId不能为空');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toEqual(expect.objectContaining({ code: 'CHILD_ID_REQUIRED', message: 'childId不能为空' }));
    expect(res.body.meta.schemaVersion).toBe(1);
  });
});
