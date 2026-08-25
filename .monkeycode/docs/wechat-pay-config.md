# 微信支付配置协作文档

## 当前已确认信息

- 小程序 AppID：`wxb22908624ec860fe`
- 微信支付商户号：`1746839960`
- 商户 API 证书序列号：`49AA047D48AF498D84664E07669BC50F602C1631`
- 支付回调地址：`https://api.woyai.cn/api/v1/payment/notify`

## 当前会员支付模式

- 会员套餐属于虚拟内容服务，会员页使用微信官方小程序虚拟支付能力。
- 普通 `/payment/create` 和 `/payment/unified-order` 路径会拒绝会员套餐，并返回 `VIRTUAL_PAYMENT_REQUIRED`。
- 虚拟支付使用 `WECHAT_VIRTUAL_PAY_OFFER_ID`、`WECHAT_VIRTUAL_PAY_APP_KEY`、`WECHAT_VIRTUAL_PAY_SANDBOX_APP_KEY`、`WECHAT_VIRTUAL_PAY_PRODUCT_MONTH`、`WECHAT_VIRTUAL_PAY_PRODUCT_QUARTER` 和 `WECHAT_VIRTUAL_PAY_PRODUCT_YEAR`。
- 生产环境默认使用正式虚拟支付环境；测试环境默认使用沙箱环境。显式设置 `WECHAT_VIRTUAL_PAY_ENV` 或 `XPAY_ENV` 可覆盖默认值。
- 虚拟支付消息推送使用 `WECHAT_MESSAGE_PUSH_TOKEN`，生产环境必须配置该 token 才接受消息推送。
- 会员支付完成后，小程序通过 `/payment/query/:order_no` 查询订单状态并刷新会员状态。

## 需要你本地填写的信息

请在你自己的本地副本或密码管理器中保存真实值，聊天里只告诉我“已设置”。

```bash
WECHAT_APPID=wxb22908624ec860fe
WECHAT_PAY_MCH_ID=1746839960
WECHAT_PAY_API_KEY=请填写你在微信支付后台设置的32位APIv3密钥
WECHAT_PAY_NOTIFY_URL=https://api.woyai.cn/api/v1/payment/notify
WECHAT_PAY_CERT_SERIAL_NO=49AA047D48AF498D84664E07669BC50F602C1631
WECHAT_PAY_CERT_PATH=/home/ubuntu/niuniu-parenting/backend/certs/apiclient_cert.pem
WECHAT_PAY_KEY_PATH=/home/ubuntu/niuniu-parenting/backend/certs/apiclient_key.pem
```

## 证书文件放置位置

建议在服务器后端目录下创建证书目录：

```bash
# 创建证书目录
mkdir -p /home/ubuntu/niuniu-parenting/backend/certs
```

需要上传的文件：

- `apiclient_cert.pem`
- `apiclient_key.pem`

上传后建议设置权限：

```bash
# 限制证书目录权限
chmod 700 /home/ubuntu/niuniu-parenting/backend/certs

# 限制私钥和证书权限
chmod 600 /home/ubuntu/niuniu-parenting/backend/certs/apiclient_cert.pem
chmod 600 /home/ubuntu/niuniu-parenting/backend/certs/apiclient_key.pem
```

## 后端 .env 配置模板

后端项目读取以下环境变量。把真实值写入服务器上的后端 `.env` 文件。

```bash
WECHAT_APPID=wxb22908624ec860fe
WECHAT_PAY_MCH_ID=1746839960
WECHAT_PAY_API_KEY=请填写真实APIv3密钥
WECHAT_PAY_NOTIFY_URL=https://api.woyai.cn/api/v1/payment/notify
WECHAT_PAY_CERT_PATH=/home/ubuntu/niuniu-parenting/backend/certs/apiclient_cert.pem
WECHAT_PAY_KEY_PATH=/home/ubuntu/niuniu-parenting/backend/certs/apiclient_key.pem
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

- `/api/v1/payment/virtual-order` 能创建虚拟支付订单并返回签名参数
- 小程序会员页能调用 `wx.requestVirtualPayment`
- 虚拟支付发货消息能通过 token 验签并幂等开通会员
- `/api/v1/payment/query/:order_no` 能返回 `paid` 状态
- 真实微信平台回调、证书加载和真机购买完成后再记录生产验收结果

## 敏感信息规则

- API v3 密钥不要发到聊天里。
- `apiclient_key.pem` 私钥内容不要发到聊天里。
- 证书文件可以由你上传到服务器指定目录，我只根据路径配置服务。
