const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

loadEnv(path.resolve(__dirname, '../../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

const app = express();
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const API_PREFIXES = Array.from(new Set([API_PREFIX, '/api/v1']));
const PORT = Number(process.env.PORT || 3002);
const HOST = process.env.HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET;
const WECHAT_PAY_HOST = 'api.mch.weixin.qq.com';
const REFERRAL_REWARD_DAYS = 7;
const REFERRAL_MAX_DAYS = 60;
const NUTRITION_RECIPES = [
  {
    id: 'nutrition_001',
    title: '小米南瓜粥',
    name: '小米南瓜粥',
    description: '南瓜香甜、小米软糯，适合早餐或晚餐，口感温和好入口。',
    category: '早餐',
    tags: ['早餐', '3-6岁', '健脾', '秋冬'],
    ageRange: '3-6岁',
    cookTime: '35分钟',
    calories: '180卡',
    difficulty: '简单',
    ingredients: [{ name: '小米', amount: '50g' }, { name: '南瓜', amount: '100g' }, { name: '清水', amount: '500ml' }],
    steps: ['小米洗净浸泡', '南瓜切块', '先煮小米后加南瓜', '小火煮至软糯'],
    nutrition: { highlight: '软糯易消化，适合早餐能量补充', protein: '4g', carbs: '32g', fat: '2g', fiber: '3g' },
    tips: '低龄儿童可煮得更软，避免额外加糖。',
    viewCount: 168
  },
  {
    id: 'nutrition_002',
    title: '酸汤番茄豆腐鱼片',
    name: '酸汤番茄豆腐鱼片',
    description: '借鉴贵阳酸汤鱼风味，用番茄和少量红酸汤提鲜，鱼片嫩滑，酸香开胃。',
    category: '汤品',
    tags: ['汤品', '酸汤', '蛋白质', '雨水'],
    ageRange: '3-6岁',
    cookTime: '30分钟',
    calories: '230卡',
    difficulty: '中等',
    ingredients: [{ name: '无刺鱼片', amount: '120g' }, { name: '嫩豆腐', amount: '100g' }, { name: '番茄', amount: '1个' }, { name: '红酸汤', amount: '1小勺' }],
    steps: ['番茄炒出汁', '加水和少量红酸汤煮开', '放入豆腐小火煮', '鱼片最后下锅煮熟'],
    nutrition: { highlight: '鱼肉和豆腐补充优质蛋白，酸香帮助打开胃口', protein: '21g', carbs: '8g', fat: '9g', fiber: '2g' },
    tips: '儿童版少放酸汤，不加辣椒，鱼刺需提前处理干净。',
    viewCount: 156
  },
  {
    id: 'nutrition_003',
    title: '糯玉米蒸蛋',
    name: '糯玉米蒸蛋',
    description: '蒸蛋细腻，加入玉米粒提升咀嚼兴趣，适合加餐或早餐。',
    category: '早餐',
    tags: ['早餐', '优质蛋白', '加餐'],
    ageRange: '3-6岁',
    cookTime: '15分钟',
    calories: '160卡',
    difficulty: '简单',
    ingredients: [{ name: '鸡蛋', amount: '1个' }, { name: '糯玉米粒', amount: '30g' }, { name: '温水', amount: '100ml' }],
    steps: ['蛋液加温水打匀', '加入玉米粒', '中火蒸约10分钟'],
    nutrition: { highlight: '蛋白质和碳水搭配，适合活动前后补充', protein: '9g', carbs: '12g', fat: '7g', fiber: '2g' },
    tips: '玉米粒给低龄孩子吃时可切碎。',
    viewCount: 118
  },
  {
    id: 'nutrition_004',
    title: '丝娃娃式彩蔬卷',
    name: '丝娃娃式彩蔬卷',
    description: '参考贵阳丝娃娃，把土豆丝、黄瓜丝、豆腐丝和胡萝卜丝卷起来，酸香清爽。',
    category: '午餐',
    tags: ['贵阳特色', '丝娃娃', '蔬菜', '春夏'],
    ageRange: '3-6岁',
    cookTime: '25分钟',
    calories: '210卡',
    difficulty: '中等',
    ingredients: [{ name: '薄面皮', amount: '6张' }, { name: '土豆丝', amount: '60g' }, { name: '黄瓜丝', amount: '50g' }, { name: '豆腐丝', amount: '50g' }, { name: '胡萝卜丝', amount: '40g' }],
    steps: ['土豆丝焯熟放凉', '蔬菜切细丝', '面皮包入彩蔬', '蘸少量番茄酸汤食用'],
    nutrition: { highlight: '多种蔬菜提升膳食纤维和维生素摄入', protein: '8g', carbs: '34g', fat: '4g', fiber: '6g' },
    tips: '儿童蘸水用番茄酸汤加少量芝麻酱，避免重辣。',
    viewCount: 146
  },
  {
    id: 'nutrition_005',
    title: '春笋豌豆苗肉末饭',
    name: '春笋豌豆苗肉末饭',
    description: '春季时令春笋搭配豌豆苗和肉末，清鲜中带一点黔式糟辣香。',
    category: '午餐',
    tags: ['春季', '春笋', '豌豆苗', '铁锌补充'],
    ageRange: '3-6岁',
    cookTime: '28分钟',
    calories: '330卡',
    difficulty: '简单',
    ingredients: [{ name: '米饭', amount: '1小碗' }, { name: '春笋', amount: '60g' }, { name: '豌豆苗', amount: '40g' }, { name: '瘦肉末', amount: '60g' }, { name: '糟辣椒汁', amount: '少量' }],
    steps: ['春笋焯水切丁', '肉末炒熟', '加入春笋和豌豆苗翻炒', '拌入米饭焖2分钟'],
    nutrition: { highlight: '瘦肉提供铁锌，春笋和豌豆苗补充膳食纤维', protein: '16g', carbs: '48g', fat: '8g', fiber: '5g' },
    tips: '糟辣椒只取少量发酵香味，儿童份不放辣椒碎。',
    viewCount: 139
  },
  {
    id: 'nutrition_006',
    title: '香椿鸡蛋软饼',
    name: '香椿鸡蛋软饼',
    description: '贵州春天常见香椿入菜，和鸡蛋做成软饼，香气鲜明，适合早餐尝鲜。',
    category: '早餐',
    tags: ['春季', '香椿', '鸡蛋', '尝鲜'],
    ageRange: '3-6岁',
    cookTime: '18分钟',
    calories: '190卡',
    difficulty: '简单',
    ingredients: [{ name: '香椿芽', amount: '20g' }, { name: '鸡蛋', amount: '1个' }, { name: '面粉', amount: '40g' }, { name: '清水', amount: '适量' }],
    steps: ['香椿焯水切碎', '鸡蛋面粉调成稀糊', '加入香椿碎', '平底锅小火摊成软饼'],
    nutrition: { highlight: '鸡蛋补充蛋白质，香椿带来春季风味', protein: '10g', carbs: '26g', fat: '6g', fiber: '2g' },
    tips: '香椿必须焯水，首次尝试少量观察接受度。',
    viewCount: 122
  },
  {
    id: 'nutrition_007',
    title: '蕨菜土豆牛肉丝',
    name: '蕨菜土豆牛肉丝',
    description: '用春季蕨菜替代重腊肉搭配，和牛肉丝、土豆丝同炒，保留山野清香。',
    category: '晚餐',
    tags: ['春季', '蕨菜', '牛肉', '补铁'],
    ageRange: '6-12岁',
    cookTime: '30分钟',
    calories: '285卡',
    difficulty: '中等',
    ingredients: [{ name: '蕨菜', amount: '80g' }, { name: '牛肉丝', amount: '80g' }, { name: '土豆丝', amount: '70g' }, { name: '蒜苗', amount: '少量' }],
    steps: ['蕨菜充分焯水', '牛肉丝腌制后快炒', '土豆丝炒至断生', '加入蕨菜和蒜苗翻匀'],
    nutrition: { highlight: '牛肉补铁，土豆补能量，蕨菜增加季节风味', protein: '20g', carbs: '25g', fat: '10g', fiber: '5g' },
    tips: '蕨菜需焯水并确认来源安全，低龄儿童少量尝试。',
    viewCount: 112
  },
  {
    id: 'nutrition_008',
    title: '素瓜豆清汤粉',
    name: '素瓜豆清汤粉',
    description: '参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜，搭配米粉清爽不腻。',
    category: '午餐',
    tags: ['夏季', '素瓜豆', '清爽', '补水'],
    ageRange: '3-6岁',
    cookTime: '25分钟',
    calories: '260卡',
    difficulty: '简单',
    ingredients: [{ name: '米粉', amount: '100g' }, { name: '嫩南瓜', amount: '80g' }, { name: '四季豆', amount: '60g' }, { name: '鸡汤或清水', amount: '400ml' }],
    steps: ['四季豆煮熟切段', '嫩南瓜切片', '清汤煮南瓜和四季豆', '加入米粉煮软'],
    nutrition: { highlight: '夏季清爽补水，主食和蔬菜搭配均衡', protein: '6g', carbs: '50g', fat: '3g', fiber: '5g' },
    tips: '四季豆必须彻底煮熟，儿童份少油少盐。',
    viewCount: 154
  },
  {
    id: 'nutrition_009',
    title: '番茄酸汤豆花饭',
    name: '番茄酸汤豆花饭',
    description: '贵州豆花饭思路改成儿童友好版，番茄酸汤配嫩豆花，开胃又补蛋白。',
    category: '午餐',
    tags: ['夏季', '豆花饭', '酸汤', '蛋白质'],
    ageRange: '3-6岁',
    cookTime: '20分钟',
    calories: '300卡',
    difficulty: '简单',
    ingredients: [{ name: '嫩豆花', amount: '150g' }, { name: '米饭', amount: '1小碗' }, { name: '番茄', amount: '1个' }, { name: '豆芽', amount: '40g' }],
    steps: ['番茄炒软加水煮汤', '豆芽煮熟', '放入豆花小火加热', '配米饭食用'],
    nutrition: { highlight: '豆制品补充植物蛋白，番茄提供维生素和酸香', protein: '13g', carbs: '42g', fat: '8g', fiber: '4g' },
    tips: '成人可另配糊辣椒蘸水，儿童版保持清淡。',
    viewCount: 143
  },
  {
    id: 'nutrition_010',
    title: '豌豆凉粉鸡丝碗',
    name: '豌豆凉粉鸡丝碗',
    description: '参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝，做成轻食加餐。',
    category: '加餐',
    tags: ['夏季', '豌豆凉粉', '鸡丝', '清凉'],
    ageRange: '6-12岁',
    cookTime: '20分钟',
    calories: '210卡',
    difficulty: '简单',
    ingredients: [{ name: '豌豆凉粉', amount: '120g' }, { name: '熟鸡胸肉丝', amount: '50g' }, { name: '黄瓜丝', amount: '50g' }, { name: '芝麻酱', amount: '1小勺' }],
    steps: ['凉粉切条', '鸡胸肉撕丝', '加入黄瓜丝', '用芝麻酱和少量醋拌匀'],
    nutrition: { highlight: '清爽补水，鸡丝补充蛋白质', protein: '15g', carbs: '22g', fat: '7g', fiber: '3g' },
    tips: '少用油辣椒，胃肠敏感时少量食用。',
    viewCount: 118
  },
  {
    id: 'nutrition_011',
    title: '板栗山药鸡汤',
    name: '板栗山药鸡汤',
    description: '秋季板栗成熟时做温和鸡汤，粉糯清甜，适合换季补充能量。',
    category: '汤品',
    tags: ['秋季', '板栗', '山药', '换季'],
    ageRange: '3-6岁',
    cookTime: '55分钟',
    calories: '320卡',
    difficulty: '中等',
    ingredients: [{ name: '鸡腿肉', amount: '120g' }, { name: '板栗', amount: '60g' }, { name: '山药', amount: '80g' }, { name: '姜片', amount: '2片' }],
    steps: ['鸡腿肉焯水', '板栗去壳', '山药切段', '所有食材小火炖至软烂'],
    nutrition: { highlight: '鸡肉补蛋白，板栗和山药提供温和碳水', protein: '22g', carbs: '34g', fat: '11g', fiber: '4g' },
    tips: '山药处理时注意防痒，儿童食用前去骨切小块。',
    viewCount: 166
  },
  {
    id: 'nutrition_012',
    title: '木姜子冬瓜丸子汤',
    name: '木姜子冬瓜丸子汤',
    description: '木姜子是黔味特色香气，少量点缀冬瓜肉丸汤，清香开胃。',
    category: '汤品',
    tags: ['夏秋', '木姜子', '冬瓜', '清爽'],
    ageRange: '3-6岁',
    cookTime: '30分钟',
    calories: '210卡',
    difficulty: '中等',
    ingredients: [{ name: '冬瓜', amount: '120g' }, { name: '猪肉丸', amount: '80g' }, { name: '木姜子油', amount: '1滴' }, { name: '葱花', amount: '少量' }],
    steps: ['冬瓜切片', '清水煮肉丸', '加入冬瓜煮软', '出锅前点一滴木姜子油'],
    nutrition: { highlight: '冬瓜清爽补水，肉丸补充蛋白质', protein: '14g', carbs: '8g', fat: '12g', fiber: '2g' },
    tips: '木姜子味道明显，儿童版只用极少量。',
    viewCount: 133
  },
  {
    id: 'nutrition_013',
    title: '糟辣番茄鸡蛋面',
    name: '糟辣番茄鸡蛋面',
    description: '保留贵州糟辣椒酸辣鲜香，用番茄和鸡蛋做成温和面食。',
    category: '早餐',
    tags: ['糟辣椒', '早餐', '开胃', '贵阳口味'],
    ageRange: '6-12岁',
    cookTime: '18分钟',
    calories: '310卡',
    difficulty: '简单',
    ingredients: [{ name: '面条', amount: '80g' }, { name: '鸡蛋', amount: '1个' }, { name: '番茄', amount: '1个' }, { name: '糟辣椒汁', amount: '少量' }],
    steps: ['番茄炒出汁', '加水煮开', '放入面条', '打入鸡蛋并加少量糟辣椒汁'],
    nutrition: { highlight: '主食、鸡蛋和番茄搭配，适合胃口差的早餐', protein: '13g', carbs: '48g', fat: '8g', fiber: '3g' },
    tips: '儿童版只取糟辣香味，控制辣度和盐量。',
    viewCount: 151
  },
  {
    id: 'nutrition_014',
    title: '豆米南瓜软烩饭',
    name: '豆米南瓜软烩饭',
    description: '贵州豆米火锅的温和灵感版，用芸豆和南瓜做软烩饭，香糯暖胃。',
    category: '晚餐',
    tags: ['冬季', '豆米', '南瓜', '暖胃'],
    ageRange: '3-6岁',
    cookTime: '40分钟',
    calories: '340卡',
    difficulty: '中等',
    ingredients: [{ name: '熟芸豆', amount: '70g' }, { name: '南瓜', amount: '100g' }, { name: '米饭', amount: '1小碗' }, { name: '青菜碎', amount: '40g' }],
    steps: ['南瓜蒸软压泥', '熟芸豆煮至粉糯', '加入米饭小火烩煮', '最后放青菜碎'],
    nutrition: { highlight: '豆类提供植物蛋白和膳食纤维，适合冬季晚餐', protein: '11g', carbs: '58g', fat: '5g', fiber: '8g' },
    tips: '芸豆需提前煮熟煮透，低龄儿童可压碎。',
    viewCount: 147
  },
  {
    id: 'nutrition_015',
    title: '折耳根牛肉米线',
    name: '折耳根牛肉米线',
    description: '折耳根是贵州餐桌代表食材，儿童版切碎少量点缀，搭配牛肉和米线。',
    category: '午餐',
    tags: ['贵州特色', '折耳根', '牛肉', '补铁'],
    ageRange: '6-12岁',
    cookTime: '25分钟',
    calories: '360卡',
    difficulty: '中等',
    ingredients: [{ name: '米线', amount: '120g' }, { name: '牛肉片', amount: '80g' }, { name: '青菜', amount: '50g' }, { name: '折耳根', amount: '少量' }],
    steps: ['牛肉片焯熟', '米线煮软', '加入青菜', '折耳根切碎后少量撒入'],
    nutrition: { highlight: '牛肉补铁，米线补能量，青菜补维生素', protein: '20g', carbs: '55g', fat: '7g', fiber: '4g' },
    tips: '折耳根气味明显，首次给孩子只放一点，也可给家长单独加。',
    viewCount: 171
  },
  {
    id: 'nutrition_016',
    title: '酸萝卜黄瓜鸡蛋卷',
    name: '酸萝卜黄瓜鸡蛋卷',
    description: '参考丝娃娃和夏日凉菜的酸爽思路，用酸萝卜、黄瓜和鸡蛋做清爽加餐。',
    category: '加餐',
    tags: ['夏季', '酸萝卜', '清爽', '加餐'],
    ageRange: '6-12岁',
    cookTime: '15分钟',
    calories: '170卡',
    difficulty: '简单',
    ingredients: [{ name: '鸡蛋饼', amount: '1张' }, { name: '黄瓜丝', amount: '50g' }, { name: '酸萝卜丝', amount: '30g' }, { name: '豆干丝', amount: '30g' }],
    steps: ['摊一张薄蛋饼', '黄瓜和豆干切丝', '酸萝卜过水降低咸酸', '卷起后切段'],
    nutrition: { highlight: '酸爽开胃，蛋饼和豆干补充蛋白质', protein: '12g', carbs: '12g', fat: '8g', fiber: '3g' },
    tips: '酸萝卜需控制量，避免盐分过高。',
    viewCount: 109
  },
  {
    id: 'nutrition_017',
    title: '清明菜豆沙小粑',
    name: '清明菜豆沙小粑',
    description: '贵阳春季常见清明菜粑的轻甜版本，小份做加餐，带春天青草香。',
    category: '加餐',
    tags: ['春季', '清明菜', '时令', '少糖'],
    ageRange: '3-6岁',
    cookTime: '45分钟',
    calories: '190卡',
    difficulty: '中等',
    ingredients: [{ name: '清明菜汁', amount: '适量' }, { name: '糯米粉', amount: '80g' }, { name: '红豆沙', amount: '25g' }, { name: '温水', amount: '适量' }],
    steps: ['清明菜焯水打汁', '糯米粉加汁揉团', '包入少量豆沙', '上锅蒸熟'],
    nutrition: { highlight: '小份补充能量，适合作为春季体验型点心', protein: '4g', carbs: '38g', fat: '2g', fiber: '2g' },
    tips: '糯米点心不宜多吃，3岁以下谨慎食用。',
    viewCount: 102
  },
  {
    id: 'nutrition_018',
    title: '酸汤牛肉蔬菜锅',
    name: '酸汤牛肉蔬菜锅',
    description: '秋冬版酸汤牛肉，搭配白菜、菌菇和土豆片，暖身又补铁。',
    category: '晚餐',
    tags: ['秋冬', '酸汤', '牛肉', '补铁'],
    ageRange: '6-12岁',
    cookTime: '35分钟',
    calories: '380卡',
    difficulty: '中等',
    ingredients: [{ name: '牛肉片', amount: '120g' }, { name: '白菜', amount: '80g' }, { name: '土豆片', amount: '80g' }, { name: '菌菇', amount: '60g' }, { name: '红酸汤', amount: '1小勺' }],
    steps: ['清汤加少量红酸汤煮开', '先煮土豆和菌菇', '加入白菜', '最后涮熟牛肉片'],
    nutrition: { highlight: '牛肉补铁锌，蔬菜和菌菇补充膳食纤维', protein: '26g', carbs: '30g', fat: '14g', fiber: '6g' },
    tips: '儿童份少酸少辣，牛肉切薄煮熟。',
    viewCount: 178
  }
];

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const wxPayConfig = {
  appid: process.env.WECHAT_APPID || process.env.WX_APPID || '',
  mchid: process.env.WECHAT_PAY_MCH_ID || process.env.WX_MCHID || '',
  apiKey: process.env.WECHAT_PAY_API_KEY || process.env.WX_API_KEY || '',
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || process.env.WX_NOTIFY_URL || '',
  keyPath: process.env.WECHAT_PAY_KEY_PATH || process.env.WX_KEY_PATH || '',
  certSerialNo: process.env.WECHAT_PAY_CERT_SERIAL_NO || process.env.WX_CERT_SERIAL_NO || '',
  platformCertPath: process.env.WECHAT_PAY_PLATFORM_CERT_PATH || process.env.WX_PLATFORM_CERT_PATH || ''
};

app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    if (req.originalUrl === `${API_PREFIX}/payment/notify`) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));

app.get('/health', healthHandler);
for (const prefix of API_PREFIXES) {
  app.get(`${prefix}/health`, healthHandler);
  app.post(`${prefix}/auth/login`, asyncHandler(loginHandler));
  app.post(`${prefix}/auth/refresh`, asyncHandler(refreshHandler));
  app.get(`${prefix}/auth/me`, authenticateToken, asyncHandler(meHandler));
  app.get(`${prefix}/membership/info`, authenticateToken, asyncHandler(membershipInfoHandler));
  app.post(`${prefix}/membership/trial/activate`, authenticateToken, asyncHandler(trialHandler));
  app.post(`${prefix}/membership/promo/redeem`, authenticateToken, asyncHandler(promoHandler));
  app.get(`${prefix}/referral/stats`, authenticateToken, asyncHandler(referralStatsHandler));
  app.get(`${prefix}/referral/code`, authenticateToken, asyncHandler(referralCodeHandler));
  app.post(`${prefix}/payment/create`, authenticateToken, asyncHandler(createPaymentOrderHandler));
  app.post(`${prefix}/payment/unified-order`, authenticateToken, asyncHandler(unifiedOrderHandler));
  app.get(`${prefix}/payment/query/:order_no`, authenticateToken, asyncHandler(queryPaymentHandler));
  app.post(`${prefix}/payment/notify`, asyncHandler(paymentNotifyHandler));
  app.get(`${prefix}/nutrition/recommendations`, nutritionRecommendationsHandler);
  app.get(`${prefix}/nutrition/recipes`, nutritionRecipesHandler);
  app.get(`${prefix}/nutrition/recipes/:id`, nutritionRecipeDetailHandler);
  app.post(`${prefix}/nutrition/recipes/:id/favorite`, authenticateToken, nutritionRecipeFavoriteHandler);
  app.all(`${prefix}/assessments*`, authenticateToken, requireActiveMembership, paidFeaturePlaceholderHandler);
  app.all(`${prefix}/chat*`, authenticateToken, requireActiveMembership, paidFeaturePlaceholderHandler);
  app.all(`${prefix}/education*`, authenticateToken, requireActiveMembership, paidFeaturePlaceholderHandler);
  app.all(`${prefix}/recommendations*`, authenticateToken, requireActiveMembership, paidFeaturePlaceholderHandler);
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('[niuniu-backend]', err.message);
  res.status(500).json({ success: false, message: err.message || '服务异常' });
});

app.listen(PORT, HOST, () => {
  console.log(`[niuniu-backend] listening on http://${HOST}:${PORT}`);
});

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }
    const index = line.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function healthHandler(req, res) {
  res.json({ status: 'ok', service: 'niuniu-backend', timestamp: new Date().toISOString() });
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET || 'dev-niuniu-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ success: false, message: '未提供访问令牌' });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET || 'dev-niuniu-secret');
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: '访问令牌无效或已过期' });
  }
}

async function requireActiveMembership(req, res, next) {
  const active = await isActiveMember(req.user.userId);
  if (!active) {
    res.status(403).json({
      success: false,
      code: 'MEMBERSHIP_REQUIRED',
      message: '会员已到期或尚未开通，请先开通会员'
    });
    return;
  }
  next();
}

function paidFeaturePlaceholderHandler(req, res) {
  res.status(404).json({ success: false, message: '接口暂未在生产服务开放', path: req.path });
}

async function loginHandler(req, res) {
  const code = req.body && req.body.code;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ success: false, message: '缺少微信登录code' });
    return;
  }
  const session = await getWechatSession(code);
  const { user, isNew: isNewUser } = await findOrCreateUser(session.openid, req.body.userInfo || {});

  // 处理邀请码（新用户注册时）
  if (isNewUser && req.body.invite_code) {
    await handleReferralSignup(user.id, req.body.invite_code);
  }

  const payload = { userId: user.id, openid: user.openid, username: user.nickname || '微信用户' };
  res.json({
    success: true,
    data: {
      user,
      token: signToken(payload),
      refresh_token: signToken(Object.assign({}, payload, { tokenType: 'refresh' }))
    }
  });
}

async function refreshHandler(req, res) {
  const refreshToken = req.body && req.body.refresh_token;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: '缺少刷新令牌' });
    return;
  }
  const decoded = jwt.verify(refreshToken, JWT_SECRET || 'dev-niuniu-secret');
  const payload = { userId: decoded.userId, openid: decoded.openid, username: decoded.username || '微信用户' };
  res.json({ success: true, data: { token: signToken(payload) } });
}

async function meHandler(req, res) {
  const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, created_at, updated_at FROM users WHERE id = ?', [req.user.userId]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: '用户不存在' });
    return;
  }
  res.json({ success: true, data: rows[0] });
}

async function getWechatSession(code) {
  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WECHAT_APPID and WECHAT_APP_SECRET must be configured');
    }
    return { openid: `dev_${code.replace(/[^a-zA-Z0-9_-]/g, '_')}` };
  }
  const url = 'https://api.weixin.qq.com/sns/jscode2session'
    + `?appid=${encodeURIComponent(appid)}`
    + `&secret=${encodeURIComponent(secret)}`
    + `&js_code=${encodeURIComponent(code)}`
    + '&grant_type=authorization_code';
  return requestJson(url);
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.errcode) {
            reject(new Error(data.errmsg || 'wechat request failed'));
            return;
          }
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function findOrCreateUser(openid, profile) {
  const [existing] = await pool.execute('SELECT id, openid, nickname, avatar_url, created_at, updated_at FROM users WHERE openid = ?', [openid]);
  if (existing.length) {
    return { user: existing[0], isNew: false };
  }
  const [result] = await pool.execute(
    'INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?)',
    [openid, profile.nickName || profile.nickname || '微信用户', profile.avatarUrl || profile.avatar_url || '']
  );
  const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, created_at, updated_at FROM users WHERE id = ?', [result.insertId]);
  return { user: rows[0], isNew: true };
}

async function handleReferralSignup(inviteeId, inviteCode) {
  const inviterId = parseInviteCode(inviteCode);
  if (!inviterId || inviterId === inviteeId) {
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [inviters] = await connection.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [inviterId]);
    if (!inviters.length) {
      await connection.rollback();
      return;
    }
    const [existing] = await connection.execute(
      'SELECT id FROM referrals WHERE invitee_id = ? FOR UPDATE',
      [inviteeId]
    );
    if (existing.length) {
      await connection.rollback();
      return;
    }
    const rewardDays = await getAvailableReferralRewardDays(connection, inviterId);
    await connection.execute(
      'INSERT INTO referrals (inviter_id, invitee_id, reward_days, status) VALUES (?, ?, ?, ?)',
      [inviterId, inviteeId, rewardDays, 'completed']
    );
    if (rewardDays > 0) {
      await extendMembership(connection, inviterId, rewardDays, 'referral_reward');
    }
    await extendMembership(connection, inviteeId, REFERRAL_REWARD_DAYS, 'invitee_reward');
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error('[Referral] Handle signup error:', err.message);
  } finally {
    connection.release();
  }
}

function parseInviteCode(inviteCode) {
  if (!inviteCode || typeof inviteCode !== 'string') {
    return 0;
  }
  const match = inviteCode.trim().toUpperCase().match(/^NN(\d+)$/);
  return match ? Number(match[1]) : 0;
}

async function getAvailableReferralRewardDays(connection, inviterId) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(SUM(reward_days), 0) AS total_days
     FROM referrals
     WHERE inviter_id = ?
       AND status = 'completed'
       AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
    [inviterId]
  );
  const usedDays = Number(rows[0] && rows[0].total_days) || 0;
  return Math.max(0, Math.min(REFERRAL_REWARD_DAYS, REFERRAL_MAX_DAYS - usedDays));
}

async function membershipInfoHandler(req, res) {
  const membership = await getMembership(req.user.userId);
  const [plans] = await pool.execute('SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order');
  const now = Date.now();
  const endTime = membership.current_end_date ? new Date(membership.current_end_date).getTime() : 0;
  const isActive = membership.status === 'active' && endTime > now;
  res.json({
    success: true,
    data: {
      status: isActive ? 'active' : 'free',
      membership_type: isActive ? membership.membership_type : 'free',
      is_active: isActive,
      days_left: isActive ? Math.ceil((endTime - now) / 86400000) : 0,
      is_trial_used: !!membership.is_trial_used,
      plans
    }
  });
}

async function getMembership(userId) {
  const [rows] = await pool.execute('SELECT * FROM user_memberships WHERE user_id = ?', [userId]);
  return rows[0] || { status: 'free', membership_type: 'free', is_trial_used: 0, auto_renew: 1 };
}

async function isActiveMember(userId) {
  const membership = await getMembership(userId);
  const endTime = membership.current_end_date ? new Date(membership.current_end_date).getTime() : 0;
  return membership.status === 'active' && endTime > Date.now();
}

async function extendMembership(connection, userId, days, payMethod) {
  const [memberships] = await connection.execute(
    'SELECT current_end_date, status FROM user_memberships WHERE user_id = ? FOR UPDATE',
    [userId]
  );
  const now = new Date();
  let endDate = now;
  if (memberships.length && memberships[0].status === 'active' && memberships[0].current_end_date) {
    const currentEndDate = new Date(memberships[0].current_end_date);
    if (currentEndDate > now) {
      endDate = currentEndDate;
    }
  }
  endDate.setDate(endDate.getDate() + days);
  await connection.execute(
    'INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, pay_method) VALUES (?, ?, ?, NOW(), ?, ?)',
    [userId, 'reward', 'active', endDate, payMethod]
  );
  await connection.execute(
    `INSERT INTO user_memberships (user_id, current_plan, current_end_date, membership_type, status, auto_renew)
     VALUES (?, 'reward', ?, 'reward', 'active', 1)
     ON DUPLICATE KEY UPDATE current_plan = 'reward', current_end_date = VALUES(current_end_date), membership_type = 'reward', status = 'active'`,
    [userId, endDate]
  );
}

async function trialHandler(req, res) {
  const membership = await getMembership(req.user.userId);
  if (membership.is_trial_used) {
    res.json({ success: true, data: { activated: false, reason: 'trial_already_used' } });
    return;
  }
  const endDate = new Date(Date.now() + 15 * 86400000);
  await pool.execute('INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, pay_method) VALUES (?, ?, ?, NOW(), ?, ?)', [req.user.userId, 'trial', 'active', endDate, 'trial']);
  await pool.execute(
    `INSERT INTO user_memberships (user_id, is_trial_used, trial_end_date, current_plan, current_end_date, membership_type, status, auto_renew)
     VALUES (?, 1, ?, 'trial', ?, 'trial', 'active', 1)
     ON DUPLICATE KEY UPDATE is_trial_used = 1, trial_end_date = VALUES(trial_end_date), current_plan = 'trial', current_end_date = VALUES(current_end_date), membership_type = 'trial', status = 'active', auto_renew = 1`,
    [req.user.userId, endDate, endDate]
  );
  res.json({ success: true, data: { activated: true, trial_end_date: endDate.toISOString(), days: 15 } });
}

async function promoHandler(req, res) {
  res.json({ success: false, message: '兑换码暂未开放' });
}

async function referralStatsHandler(req, res) {
  const [totalRows] = await pool.execute('SELECT COUNT(*) AS count FROM referrals WHERE inviter_id = ?', [req.user.userId]);
  const [monthlyRows] = await pool.execute(
    `SELECT COUNT(*) AS count, COALESCE(SUM(reward_days), 0) AS total_days
     FROM referrals
     WHERE inviter_id = ?
       AND status = 'completed'
       AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
    [req.user.userId]
  );
  const monthlyRewardDays = Number(monthlyRows[0] && monthlyRows[0].total_days) || 0;
  res.json({
    success: true,
    data: {
      total_invites: Number(totalRows[0] && totalRows[0].count) || 0,
      monthly_invites: Number(monthlyRows[0] && monthlyRows[0].count) || 0,
      monthly_reward_days: monthlyRewardDays,
      monthly_max_days: REFERRAL_MAX_DAYS,
      remaining_days: Math.max(0, REFERRAL_MAX_DAYS - monthlyRewardDays),
      can_earn_more: monthlyRewardDays < REFERRAL_MAX_DAYS,
      invite_code: `NN${String(req.user.userId).padStart(6, '0')}`
    }
  });
}

async function referralCodeHandler(req, res) {
  res.json({ success: true, data: { invite_code: `NN${String(req.user.userId).padStart(6, '0')}` } });
}

function normalizeNutritionRecipe(recipe) {
  return Object.assign({
    desc: recipe.description,
    content: recipe.steps.join('\n'),
    visualIcon: '',
    is_favorited: false,
    isFavorite: false,
    created_at: new Date().toISOString()
  }, recipe);
}

function filterNutritionRecipes(query) {
  const keyword = String((query && query.keyword) || '').trim();
  const category = String((query && query.category) || '').trim();
  const age = String((query && query.age) || '').trim();
  return NUTRITION_RECIPES.filter((recipe) => {
    const text = `${recipe.title} ${recipe.description} ${recipe.category} ${recipe.tags.join(' ')}`;
    if (keyword && !text.includes(keyword)) {
      return false;
    }
    if (category && recipe.category !== category) {
      return false;
    }
    if (age && age !== '全部年龄' && recipe.ageRange !== age) {
      return false;
    }
    return true;
  });
}

function nutritionRecommendationsHandler(req, res) {
  res.json({ success: true, data: NUTRITION_RECIPES.map(normalizeNutritionRecipe) });
}

function nutritionRecipesHandler(req, res) {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.page_size || req.query.pageSize || 10), 1), 30);
  const filtered = filterNutritionRecipes(req.query);
  const offset = (page - 1) * pageSize;
  const recipes = filtered.slice(offset, offset + pageSize).map(normalizeNutritionRecipe);
  res.json({
    success: true,
    data: {
      recipes,
      pagination: {
        page,
        page_size: pageSize,
        total: filtered.length,
        has_more: offset + pageSize < filtered.length
      }
    }
  });
}

function nutritionRecipeDetailHandler(req, res) {
  const recipe = NUTRITION_RECIPES.find((item) => item.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ success: false, message: '食谱不存在' });
    return;
  }
  res.json({ success: true, data: normalizeNutritionRecipe(recipe) });
}

function nutritionRecipeFavoriteHandler(req, res) {
  const recipe = NUTRITION_RECIPES.find((item) => item.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ success: false, message: '食谱不存在' });
    return;
  }
  res.json({ success: true, data: { is_favorited: true, isFavorite: true } });
}

function paymentConfigError() {
  return { success: false, code: 'WECHAT_PAY_NOT_CONFIGURED', message: '微信支付配置中，请使用试用或兑换码功能', missing_config: getMissingPayConfig() };
}

function getMissingPayConfig() {
  return [
    ['WECHAT_APPID', wxPayConfig.appid],
    ['WECHAT_PAY_MCH_ID', wxPayConfig.mchid],
    ['WECHAT_PAY_API_KEY', wxPayConfig.apiKey],
    ['WECHAT_PAY_NOTIFY_URL', wxPayConfig.notifyUrl],
    ['WECHAT_PAY_KEY_PATH', wxPayConfig.keyPath],
    ['WECHAT_PAY_CERT_SERIAL_NO', wxPayConfig.certSerialNo]
  ].filter(([, value]) => !value).map(([key]) => key);
}

function isWechatPayConfigured() {
  return getMissingPayConfig().length === 0 && fs.existsSync(wxPayConfig.keyPath);
}

async function createPaymentOrderHandler(req, res) {
  if (!isWechatPayConfigured()) {
    res.status(503).json(paymentConfigError());
    return;
  }
  const planCode = req.body && req.body.plan_code;
  if (!planCode) {
    res.status(400).json({ success: false, message: '请选择套餐' });
    return;
  }
  const [plans] = await pool.execute('SELECT * FROM plans WHERE code = ? AND is_active = 1', [planCode]);
  if (!plans.length) {
    res.status(400).json({ success: false, message: '套餐不存在' });
    return;
  }
  const plan = plans[0];
  const orderNo = `NN${Date.now()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const autoRenew = req.body.auto_renew !== false ? 1 : 0;
  await pool.execute(
    'INSERT INTO payment_orders (user_id, plan_code, order_no, amount, status, auto_renew) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.userId, planCode, orderNo, plan.price_yuan, 'pending', autoRenew]
  );
  res.json({ success: true, data: { success: true, order_no: orderNo, amount: plan.price_yuan, plan_name: plan.name, auto_renew: autoRenew === 1 } });
}

async function unifiedOrderHandler(req, res) {
  if (!isWechatPayConfigured()) {
    res.status(503).json(paymentConfigError());
    return;
  }
  const orderNo = req.body && req.body.order_no;
  if (!orderNo) {
    res.status(400).json({ success: false, message: '订单号不能为空' });
    return;
  }
  const [orders] = await pool.execute('SELECT * FROM payment_orders WHERE order_no = ? AND user_id = ?', [orderNo, req.user.userId]);
  if (!orders.length) {
    res.status(404).json({ success: false, message: '订单不存在' });
    return;
  }
  const order = orders[0];
  const [plans] = await pool.execute('SELECT * FROM plans WHERE code = ?', [order.plan_code]);
  const wxResult = await requestWechatPay('POST', '/v3/pay/transactions/jsapi', {
    appid: wxPayConfig.appid,
    mchid: wxPayConfig.mchid,
    description: plans[0] ? `小牛育儿${plans[0].name}` : '小牛育儿会员',
    out_trade_no: order.order_no,
    notify_url: wxPayConfig.notifyUrl,
    amount: { total: order.amount, currency: 'CNY' },
    payer: { openid: req.user.openid }
  });
  await pool.execute('UPDATE payment_orders SET wx_prepay_id = ? WHERE order_no = ?', [wxResult.prepay_id, order.order_no]);
  res.json({ success: true, data: Object.assign({ success: true }, buildMiniProgramPayParams(wxResult.prepay_id)) });
}

async function queryPaymentHandler(req, res) {
  const [rows] = await pool.execute('SELECT order_no, status, amount, plan_code, paid_at, auto_renew FROM payment_orders WHERE order_no = ? AND user_id = ?', [req.params.order_no, req.user.userId]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: '订单不存在' });
    return;
  }
  res.json({ success: true, data: Object.assign({ success: true }, rows[0]) });
}

async function paymentNotifyHandler(req, res) {
  if (!isWechatPayConfigured()) {
    res.status(503).json({ code: 'FAIL', message: '微信支付未配置' });
    return;
  }
  if (req.body.resource && !verifyWechatNotifySignature(req.headers, req.rawBody || '')) {
    res.status(400).json({ code: 'FAIL', message: '微信支付回调签名无效' });
    return;
  }
  const paymentData = req.body.resource ? decryptWechatResource(req.body.resource) : req.body;
  const orderNo = paymentData.out_trade_no;
  const transactionId = paymentData.transaction_id;
  if (paymentData.trade_state !== 'SUCCESS' && paymentData.result_code !== 'SUCCESS') {
    await pool.execute('UPDATE payment_orders SET status = ? WHERE order_no = ? AND status != ?', ['failed', orderNo, 'paid']);
    res.status(400).json({ code: 'FAIL', message: '支付失败' });
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute('SELECT * FROM payment_orders WHERE order_no = ? FOR UPDATE', [orderNo]);
    if (!orders.length) {
      await connection.rollback();
      res.status(404).json({ code: 'FAIL', message: '订单不存在' });
      return;
    }
    const order = orders[0];
    if (order.status !== 'paid') {
      await connection.execute('UPDATE payment_orders SET status = ?, wx_transaction_id = ?, paid_at = NOW() WHERE order_no = ?', ['paid', transactionId, orderNo]);
      await activateSubscription(connection, order.user_id, order.plan_code, orderNo, order.auto_renew === 1);
    }
    await connection.commit();
    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function activateSubscription(connection, userId, planCode, orderNo, autoRenew) {
  const [plans] = await connection.execute('SELECT * FROM plans WHERE code = ? AND is_active = 1', [planCode]);
  if (!plans.length) {
    throw new Error('套餐不存在');
  }
  const endDate = new Date(Date.now() + plans[0].duration_days * 86400000);
  await connection.execute(
    'INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, auto_renew, pay_method, order_no) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)',
    [userId, planCode, 'active', endDate, autoRenew ? 1 : 0, 'wxpay', orderNo]
  );
  await connection.execute(
    `INSERT INTO user_memberships (user_id, current_plan, current_end_date, membership_type, status, auto_renew)
     VALUES (?, ?, ?, ?, 'active', ?)
     ON DUPLICATE KEY UPDATE current_plan = VALUES(current_plan), current_end_date = VALUES(current_end_date), membership_type = VALUES(membership_type), status = 'active', auto_renew = VALUES(auto_renew)`,
    [userId, planCode, endDate, planCode, autoRenew ? 1 : 0]
  );
}

function requestWechatPay(method, apiPath, body) {
  const payload = body ? JSON.stringify(body) : '';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const message = [method, apiPath, timestamp, nonceStr, payload].join('\n') + '\n';
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(fs.readFileSync(wxPayConfig.keyPath, 'utf8'), 'base64');
  const authorization = 'WECHATPAY2-SHA256-RSA2048 '
    + `mchid="${wxPayConfig.mchid}",`
    + `nonce_str="${nonceStr}",`
    + `signature="${signature}",`
    + `timestamp="${timestamp}",`
    + `serial_no="${wxPayConfig.certSerialNo}"`;
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: WECHAT_PAY_HOST,
      path: apiPath,
      method,
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'niuniu-parenting-backend/1.0'
      },
      timeout: 10000
    }, (response) => {
      let responseBody = '';
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        let parsed = {};
        if (responseBody) {
          try {
            parsed = JSON.parse(responseBody);
          } catch (err) {
            reject(new Error('微信支付响应解析失败'));
            return;
          }
        }
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsed);
          return;
        }
        reject(new Error(parsed.message || parsed.detail || '微信支付请求失败'));
      });
    });
    request.on('timeout', () => request.destroy(new Error('微信支付请求超时')));
    request.on('error', reject);
    if (payload) {
      request.write(payload);
    }
    request.end();
  });
}

function buildMiniProgramPayParams(prepayId) {
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const packageValue = `prepay_id=${prepayId}`;
  const message = `${wxPayConfig.appid}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`;
  const paySign = crypto.createSign('RSA-SHA256').update(message).sign(fs.readFileSync(wxPayConfig.keyPath, 'utf8'), 'base64');
  return { appId: wxPayConfig.appid, timeStamp, nonceStr, package: packageValue, signType: 'RSA', paySign };
}

function decryptWechatResource(resource) {
  const ciphertext = Buffer.from(resource.ciphertext, 'base64');
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const encryptedData = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', wxPayConfig.apiKey, resource.nonce);
  decipher.setAuthTag(authTag);
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data));
  }
  return JSON.parse(Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8'));
}

function verifyWechatNotifySignature(headers, rawBody) {
  if (!wxPayConfig.platformCertPath) {
    return true;
  }
  const signature = headers['wechatpay-signature'];
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  if (!signature || !timestamp || !nonce || !rawBody) {
    return false;
  }
  const certificate = fs.readFileSync(wxPayConfig.platformCertPath, 'utf8');
  return crypto.createVerify('RSA-SHA256').update(`${timestamp}\n${nonce}\n${rawBody}\n`).verify(certificate, signature, 'base64');
}
