# 微信支付配置协作文档

## 当前已确认信息

- 小程序 AppID：`wxb22908624ec860fe`
- 微信支付商户号：`1746839960`
- 商户 API 证书序列号：`49AA047D48AF498D84664E07669BC50F602C1631`
- 支付回调地址：`https://api.woyai.cn/api/v1/payment/notify`

## 需要你本地填写的信息

请在你自己的本地副本或密码管理器中保存真实值，聊天里只告诉我“已设置”。

```bash
WECHAT_APPID=wxb22908624ec860fe
WECHAT_PAY_MCH_ID=1746839960
WECHAT_PAY_API_KEY=请填写你在微信支付后台设置的32位APIv3密钥
WECHAT_PAY_NOTIFY_URL=https://api.woyai.cn/api/v1/payment/notify
WECHAT_PAY_CERT_SERIAL_NO=49AA047D48AF498D84664E07669BC50F602C1631
WECHAT_PAY_CERT_PATH=/home/ubuntu/zgxnai/backend/certs/apiclient_cert.pem
WECHAT_PAY_KEY_PATH=/home/ubuntu/zgxnai/backend/certs/apiclient_key.pem
```

## 证书文件放置位置

建议在服务器后端目录下创建证书目录：

```bash
# 创建证书目录
mkdir -p /home/ubuntu/zgxnai/backend/certs
```

需要上传的文件：

- `apiclient_cert.pem`
- `apiclient_key.pem`

上传后建议设置权限：

```bash
# 限制证书目录权限
chmod 700 /home/ubuntu/zgxnai/backend/certs

# 限制私钥和证书权限
chmod 600 /home/ubuntu/zgxnai/backend/certs/apiclient_cert.pem
chmod 600 /home/ubuntu/zgxnai/backend/certs/apiclient_key.pem
```

## 后端 .env 配置模板

后端项目读取以下环境变量。把真实值写入服务器上的后端 `.env` 文件。

```bash
WECHAT_APPID=wxb22908624ec860fe
WECHAT_PAY_MCH_ID=1746839960
WECHAT_PAY_API_KEY=请填写真实APIv3密钥
WECHAT_PAY_NOTIFY_URL=https://api.woyai.cn/api/v1/payment/notify
WECHAT_PAY_CERT_PATH=/home/ubuntu/zgxnai/backend/certs/apiclient_cert.pem
WECHAT_PAY_KEY_PATH=/home/ubuntu/zgxnai/backend/certs/apiclient_key.pem
```

## 会员套餐待确认

请确认准备上线的套餐和价格。

```text
月卡：待定
季卡：待定
年卡：待定
是否开自动续费：待定
```

## 配置完成后的验证

配置完成并重启后端后，验证目标：

- `/api/v1/payment/create` 不再返回 `WECHAT_PAY_NOT_CONFIGURED`
- 小程序会员页点击购买能创建订单
- 后端能返回微信支付所需参数
- 小程序端能调用 `wx.requestPayment`

## 敏感信息规则

- API v3 密钥不要发到聊天里。
- `apiclient_key.pem` 私钥内容不要发到聊天里。
- 证书文件可以由你上传到服务器指定目录，我只根据路径配置服务。
