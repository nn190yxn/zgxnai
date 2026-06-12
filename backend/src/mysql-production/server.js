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
    "id": "nutrition_019",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米泥，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "25分钟",
    "calories": "110卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "42g"
      },
      {
        "name": "萝卜",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 85
  },
  {
    "id": "nutrition_020",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，泥清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "29分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "萝卜",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 147
  },
  {
    "id": "nutrition_021",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉泥，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "20分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "23g"
      },
      {
        "name": "萝卜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 72
  },
  {
    "id": "nutrition_022",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "17分钟",
    "calories": "110卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "萝卜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 240
  },
  {
    "id": "nutrition_023",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜泥，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "23分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "42g"
      },
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 59
  },
  {
    "id": "nutrition_024",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "17分钟",
    "calories": "110卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "41g"
      },
      {
        "name": "豌豆苗",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 51
  },
  {
    "id": "nutrition_025",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成泥。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "24分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "48g"
      },
      {
        "name": "豌豆苗",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 240
  },
  {
    "id": "nutrition_026",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "23分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "37g"
      },
      {
        "name": "豌豆苗",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 98
  },
  {
    "id": "nutrition_027",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "16分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "49g"
      },
      {
        "name": "豌豆苗",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 119
  },
  {
    "id": "nutrition_028",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "33分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "38g"
      },
      {
        "name": "豌豆苗",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 202
  },
  {
    "id": "nutrition_029",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米泥同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "21分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "41g"
      },
      {
        "name": "春笋",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 75
  },
  {
    "id": "nutrition_030",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "12分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "28g"
      },
      {
        "name": "春笋",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 76
  },
  {
    "id": "nutrition_031",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "34分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "34g"
      },
      {
        "name": "春笋",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 147
  },
  {
    "id": "nutrition_032",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮泥。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "39分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "30g"
      },
      {
        "name": "春笋",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 241
  },
  {
    "id": "nutrition_033",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "33分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "25g"
      },
      {
        "name": "春笋",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 76
  },
  {
    "id": "nutrition_034",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "18分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "21g"
      },
      {
        "name": "蕨菜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 197
  },
  {
    "id": "nutrition_035",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮泥，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "22分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "39g"
      },
      {
        "name": "蕨菜",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 220
  },
  {
    "id": "nutrition_036",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮泥，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "11分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "33g"
      },
      {
        "name": "蕨菜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 243
  },
  {
    "id": "nutrition_037",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "17分钟",
    "calories": "100卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "41g"
      },
      {
        "name": "蕨菜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 200
  },
  {
    "id": "nutrition_038",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "23分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "25g"
      },
      {
        "name": "蕨菜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 215
  },
  {
    "id": "nutrition_039",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米泥同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "19分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "42g"
      },
      {
        "name": "四季豆",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 241
  },
  {
    "id": "nutrition_040",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮泥，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "22分钟",
    "calories": "100卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "23g"
      },
      {
        "name": "四季豆",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 189
  },
  {
    "id": "nutrition_041",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮泥，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "37分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "四季豆",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 121
  },
  {
    "id": "nutrition_042",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "24分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "42g"
      },
      {
        "name": "四季豆",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 186
  },
  {
    "id": "nutrition_043",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌泥，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "15分钟",
    "calories": "100卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "46g"
      },
      {
        "name": "四季豆",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 82
  },
  {
    "id": "nutrition_044",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "22分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "32g"
      },
      {
        "name": "嫩南瓜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 178
  },
  {
    "id": "nutrition_045",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花泥思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "25分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "嫩南瓜",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 183
  },
  {
    "id": "nutrition_046",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮泥。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "36分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "29g"
      },
      {
        "name": "嫩南瓜",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 185
  },
  {
    "id": "nutrition_047",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "13分钟",
    "calories": "90卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "32g"
      },
      {
        "name": "嫩南瓜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 86
  },
  {
    "id": "nutrition_048",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮泥，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "15分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "34g"
      },
      {
        "name": "嫩南瓜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 95
  },
  {
    "id": "nutrition_049",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "19分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "48g"
      },
      {
        "name": "嫩南瓜",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 224
  },
  {
    "id": "nutrition_050",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮泥。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "18分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "41g"
      },
      {
        "name": "嫩南瓜",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 143
  },
  {
    "id": "nutrition_051",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米泥同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "12分钟",
    "calories": "90卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "45g"
      },
      {
        "name": "嫩南瓜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 149
  },
  {
    "id": "nutrition_052",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "14分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "26g"
      },
      {
        "name": "嫩南瓜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 157
  },
  {
    "id": "nutrition_053",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "35分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "26g"
      },
      {
        "name": "嫩南瓜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 126
  },
  {
    "id": "nutrition_054",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸泥。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "34分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "四季豆",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 112
  },
  {
    "id": "nutrition_055",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "16分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "四季豆",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 51
  },
  {
    "id": "nutrition_056",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "29分钟",
    "calories": "90卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "34g"
      },
      {
        "name": "四季豆",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 167
  },
  {
    "id": "nutrition_057",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮泥，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "22分钟",
    "calories": "90卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "四季豆",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 185
  },
  {
    "id": "nutrition_058",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "30分钟",
    "calories": "90卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "24g"
      },
      {
        "name": "四季豆",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 155
  },
  {
    "id": "nutrition_059",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡泥。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "17分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "48g"
      },
      {
        "name": "山药",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 136
  },
  {
    "id": "nutrition_060",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮泥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "30分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "28g"
      },
      {
        "name": "山药",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 157
  },
  {
    "id": "nutrition_061",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "29分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "20g"
      },
      {
        "name": "山药",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 243
  },
  {
    "id": "nutrition_062",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮泥，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "27分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "42g"
      },
      {
        "name": "山药",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 194
  },
  {
    "id": "nutrition_063",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米泥同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "27分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "25g"
      },
      {
        "name": "山药",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 204
  },
  {
    "id": "nutrition_064",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，泥清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "35分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "21g"
      },
      {
        "name": "山药",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 173
  },
  {
    "id": "nutrition_065",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮泥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "30分钟",
    "calories": "100卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "22g"
      },
      {
        "name": "山药",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 140
  },
  {
    "id": "nutrition_066",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "15分钟",
    "calories": "100卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "20g"
      },
      {
        "name": "山药",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 234
  },
  {
    "id": "nutrition_067",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮泥。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "28分钟",
    "calories": "100卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "31g"
      },
      {
        "name": "山药",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 116
  },
  {
    "id": "nutrition_068",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米泥同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "11分钟",
    "calories": "100卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "36g"
      },
      {
        "name": "山药",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 135
  },
  {
    "id": "nutrition_069",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "11分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "46g"
      },
      {
        "name": "白菜",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 227
  },
  {
    "id": "nutrition_070",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "23分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "26g"
      },
      {
        "name": "白菜",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 156
  },
  {
    "id": "nutrition_071",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮泥。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "34分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "49g"
      },
      {
        "name": "白菜",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 78
  },
  {
    "id": "nutrition_072",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米泥同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "26分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "22g"
      },
      {
        "name": "白菜",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 120
  },
  {
    "id": "nutrition_073",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮泥。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "19分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "41g"
      },
      {
        "name": "白菜",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 54
  },
  {
    "id": "nutrition_074",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "25分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "46g"
      },
      {
        "name": "萝卜",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 223
  },
  {
    "id": "nutrition_075",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "37分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "28g"
      },
      {
        "name": "萝卜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 86
  },
  {
    "id": "nutrition_076",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "24分钟",
    "calories": "110卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "32g"
      },
      {
        "name": "萝卜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 214
  },
  {
    "id": "nutrition_077",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮泥。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "20分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "43g"
      },
      {
        "name": "萝卜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 243
  },
  {
    "id": "nutrition_078",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "0-1岁"
    ],
    "ageRange": "0-1岁",
    "cookTime": "27分钟",
    "calories": "110卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "35g"
      },
      {
        "name": "萝卜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "3g",
      "carbs": "15g",
      "fat": "3g",
      "fiber": "1g"
    },
    "tips": "0-1岁宝宝食用时需打成泥状，确保无颗粒。",
    "viewCount": 138
  },
  {
    "id": "nutrition_079",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米碎末，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "11分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "27g"
      },
      {
        "name": "萝卜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 161
  },
  {
    "id": "nutrition_080",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，汤清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "25分钟",
    "calories": "154卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "27g"
      },
      {
        "name": "萝卜",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 88
  },
  {
    "id": "nutrition_081",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉碎末，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "29分钟",
    "calories": "154卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "42g"
      },
      {
        "name": "萝卜",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 84
  },
  {
    "id": "nutrition_082",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "18分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "41g"
      },
      {
        "name": "萝卜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 50
  },
  {
    "id": "nutrition_083",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜碎末，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "10分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "37g"
      },
      {
        "name": "萝卜",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 71
  },
  {
    "id": "nutrition_084",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "12分钟",
    "calories": "154卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "20g"
      },
      {
        "name": "豌豆苗",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 53
  },
  {
    "id": "nutrition_085",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "34分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "42g"
      },
      {
        "name": "豌豆苗",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 65
  },
  {
    "id": "nutrition_086",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "23分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "36g"
      },
      {
        "name": "豌豆苗",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 248
  },
  {
    "id": "nutrition_087",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "33分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "48g"
      },
      {
        "name": "豌豆苗",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 187
  },
  {
    "id": "nutrition_088",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "24分钟",
    "calories": "154卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "47g"
      },
      {
        "name": "豌豆苗",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 146
  },
  {
    "id": "nutrition_089",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米碎末同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "10分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "21g"
      },
      {
        "name": "春笋",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 53
  },
  {
    "id": "nutrition_090",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "16分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "22g"
      },
      {
        "name": "春笋",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 108
  },
  {
    "id": "nutrition_091",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "39分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "34g"
      },
      {
        "name": "春笋",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 121
  },
  {
    "id": "nutrition_092",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "34分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "35g"
      },
      {
        "name": "春笋",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 203
  },
  {
    "id": "nutrition_093",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "11分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "47g"
      },
      {
        "name": "春笋",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 202
  },
  {
    "id": "nutrition_094",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "10分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "35g"
      },
      {
        "name": "蕨菜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 215
  },
  {
    "id": "nutrition_095",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮碎末，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "13分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "20g"
      },
      {
        "name": "蕨菜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 75
  },
  {
    "id": "nutrition_096",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮汤，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "27分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "26g"
      },
      {
        "name": "蕨菜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 220
  },
  {
    "id": "nutrition_097",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "12分钟",
    "calories": "140卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "45g"
      },
      {
        "name": "蕨菜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 199
  },
  {
    "id": "nutrition_098",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "27分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "30g"
      },
      {
        "name": "蕨菜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 58
  },
  {
    "id": "nutrition_099",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米碎末同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "27分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "44g"
      },
      {
        "name": "四季豆",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 101
  },
  {
    "id": "nutrition_100",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮碎末，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "18分钟",
    "calories": "140卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "25g"
      },
      {
        "name": "四季豆",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 113
  },
  {
    "id": "nutrition_101",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮汤，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "27分钟",
    "calories": "140卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "41g"
      },
      {
        "name": "四季豆",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 114
  },
  {
    "id": "nutrition_102",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "19分钟",
    "calories": "140卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "48g"
      },
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 172
  },
  {
    "id": "nutrition_103",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌碎末，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "15分钟",
    "calories": "140卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "21g"
      },
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 219
  },
  {
    "id": "nutrition_104",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "13分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "23g"
      },
      {
        "name": "嫩南瓜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 150
  },
  {
    "id": "nutrition_105",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花碎末思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "10分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "嫩南瓜",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 230
  },
  {
    "id": "nutrition_106",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮碎末。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "38分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "27g"
      },
      {
        "name": "嫩南瓜",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 102
  },
  {
    "id": "nutrition_107",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "16分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "32g"
      },
      {
        "name": "嫩南瓜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 201
  },
  {
    "id": "nutrition_108",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮汤，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "20分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "49g"
      },
      {
        "name": "嫩南瓜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 196
  },
  {
    "id": "nutrition_109",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "31分钟",
    "calories": "126卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "28g"
      },
      {
        "name": "嫩南瓜",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 201
  },
  {
    "id": "nutrition_110",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮汤。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "22分钟",
    "calories": "126卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "24g"
      },
      {
        "name": "嫩南瓜",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 85
  },
  {
    "id": "nutrition_111",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米碎末同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "16分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "21g"
      },
      {
        "name": "嫩南瓜",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 50
  },
  {
    "id": "nutrition_112",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "20分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "嫩南瓜",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 215
  },
  {
    "id": "nutrition_113",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "21分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 159
  },
  {
    "id": "nutrition_114",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸汤。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "30分钟",
    "calories": "126卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "22g"
      },
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 137
  },
  {
    "id": "nutrition_115",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "36分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "32g"
      },
      {
        "name": "四季豆",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 226
  },
  {
    "id": "nutrition_116",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "26分钟",
    "calories": "126卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "38g"
      },
      {
        "name": "四季豆",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 64
  },
  {
    "id": "nutrition_117",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮碎末，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "37分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "29g"
      },
      {
        "name": "四季豆",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 103
  },
  {
    "id": "nutrition_118",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "18分钟",
    "calories": "126卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "四季豆",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 135
  },
  {
    "id": "nutrition_119",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "15分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "35g"
      },
      {
        "name": "山药",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 171
  },
  {
    "id": "nutrition_120",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮碎末。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "12分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "41g"
      },
      {
        "name": "山药",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 233
  },
  {
    "id": "nutrition_121",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "20分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "41g"
      },
      {
        "name": "山药",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 229
  },
  {
    "id": "nutrition_122",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮汤，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "13分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "26g"
      },
      {
        "name": "山药",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 201
  },
  {
    "id": "nutrition_123",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米碎末同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "36分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "43g"
      },
      {
        "name": "山药",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 241
  },
  {
    "id": "nutrition_124",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，汤清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "33分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "25g"
      },
      {
        "name": "山药",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 246
  },
  {
    "id": "nutrition_125",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮碎末。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "18分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "29g"
      },
      {
        "name": "山药",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 148
  },
  {
    "id": "nutrition_126",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "16分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "42g"
      },
      {
        "name": "山药",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 58
  },
  {
    "id": "nutrition_127",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "11分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "45g"
      },
      {
        "name": "山药",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 64
  },
  {
    "id": "nutrition_128",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米碎末同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "15分钟",
    "calories": "140卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "48g"
      },
      {
        "name": "山药",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 114
  },
  {
    "id": "nutrition_129",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "34分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "30g"
      },
      {
        "name": "白菜",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 121
  },
  {
    "id": "nutrition_130",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "18分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "32g"
      },
      {
        "name": "白菜",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 145
  },
  {
    "id": "nutrition_131",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮碎末。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "24分钟",
    "calories": "154卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "27g"
      },
      {
        "name": "白菜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 222
  },
  {
    "id": "nutrition_132",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米碎末同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "17分钟",
    "calories": "154卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "35g"
      },
      {
        "name": "白菜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 102
  },
  {
    "id": "nutrition_133",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "39分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "32g"
      },
      {
        "name": "白菜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 58
  },
  {
    "id": "nutrition_134",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "29分钟",
    "calories": "154卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "26g"
      },
      {
        "name": "萝卜",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 111
  },
  {
    "id": "nutrition_135",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "30分钟",
    "calories": "154卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "48g"
      },
      {
        "name": "萝卜",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 205
  },
  {
    "id": "nutrition_136",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "23分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "49g"
      },
      {
        "name": "萝卜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 213
  },
  {
    "id": "nutrition_137",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮碎末。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "24分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "29g"
      },
      {
        "name": "萝卜",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 197
  },
  {
    "id": "nutrition_138",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "1-2岁"
    ],
    "ageRange": "1-2岁",
    "cookTime": "32分钟",
    "calories": "154卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "43g"
      },
      {
        "name": "萝卜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "5g",
      "carbs": "20g",
      "fat": "4g",
      "fiber": "2g"
    },
    "tips": "1-2岁宝宝食用时需切碎，确保软烂易吞咽。",
    "viewCount": 201
  },
  {
    "id": "nutrition_139",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米粥，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "27分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "27g"
      },
      {
        "name": "萝卜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 203
  },
  {
    "id": "nutrition_140",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，汤清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "20分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "萝卜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 173
  },
  {
    "id": "nutrition_141",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉饭，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "28分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "38g"
      },
      {
        "name": "萝卜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 111
  },
  {
    "id": "nutrition_142",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "15分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "20g"
      },
      {
        "name": "萝卜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 109
  },
  {
    "id": "nutrition_143",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜粥，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "26分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "46g"
      },
      {
        "name": "萝卜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 108
  },
  {
    "id": "nutrition_144",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "18分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "31g"
      },
      {
        "name": "豌豆苗",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 234
  },
  {
    "id": "nutrition_145",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "20分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "36g"
      },
      {
        "name": "豌豆苗",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 194
  },
  {
    "id": "nutrition_146",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "17分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "33g"
      },
      {
        "name": "豌豆苗",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 164
  },
  {
    "id": "nutrition_147",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "21分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "29g"
      },
      {
        "name": "豌豆苗",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 245
  },
  {
    "id": "nutrition_148",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "30分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "40g"
      },
      {
        "name": "豌豆苗",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 168
  },
  {
    "id": "nutrition_149",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "11分钟",
    "calories": "200卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "30g"
      },
      {
        "name": "春笋",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 142
  },
  {
    "id": "nutrition_150",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "10分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "33g"
      },
      {
        "name": "春笋",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 99
  },
  {
    "id": "nutrition_151",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "10分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "37g"
      },
      {
        "name": "春笋",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 139
  },
  {
    "id": "nutrition_152",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "37分钟",
    "calories": "200卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "25g"
      },
      {
        "name": "春笋",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 66
  },
  {
    "id": "nutrition_153",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "12分钟",
    "calories": "200卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "46g"
      },
      {
        "name": "春笋",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 120
  },
  {
    "id": "nutrition_154",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "11分钟",
    "calories": "200卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "38g"
      },
      {
        "name": "蕨菜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 226
  },
  {
    "id": "nutrition_155",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮粥，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "25分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "26g"
      },
      {
        "name": "蕨菜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 217
  },
  {
    "id": "nutrition_156",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮汤，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "21分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "41g"
      },
      {
        "name": "蕨菜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 82
  },
  {
    "id": "nutrition_157",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "24分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "26g"
      },
      {
        "name": "蕨菜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 209
  },
  {
    "id": "nutrition_158",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "25分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "26g"
      },
      {
        "name": "蕨菜",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 168
  },
  {
    "id": "nutrition_159",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "30分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "38g"
      },
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 224
  },
  {
    "id": "nutrition_160",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "14分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "31g"
      },
      {
        "name": "四季豆",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 71
  },
  {
    "id": "nutrition_161",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮汤，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "28分钟",
    "calories": "200卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "41g"
      },
      {
        "name": "四季豆",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 240
  },
  {
    "id": "nutrition_162",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "28分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "43g"
      },
      {
        "name": "四季豆",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 180
  },
  {
    "id": "nutrition_163",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌饭，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "10分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "29g"
      },
      {
        "name": "四季豆",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 216
  },
  {
    "id": "nutrition_164",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "31分钟",
    "calories": "180卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "39g"
      },
      {
        "name": "嫩南瓜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 76
  },
  {
    "id": "nutrition_165",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花饭思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "32分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "43g"
      },
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 186
  },
  {
    "id": "nutrition_166",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "34分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "20g"
      },
      {
        "name": "嫩南瓜",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 99
  },
  {
    "id": "nutrition_167",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "19分钟",
    "calories": "180卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "25g"
      },
      {
        "name": "嫩南瓜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 101
  },
  {
    "id": "nutrition_168",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮汤，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "16分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "36g"
      },
      {
        "name": "嫩南瓜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 64
  },
  {
    "id": "nutrition_169",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "37分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "37g"
      },
      {
        "name": "嫩南瓜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 103
  },
  {
    "id": "nutrition_170",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮汤。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "36分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "嫩南瓜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 194
  },
  {
    "id": "nutrition_171",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "39分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "22g"
      },
      {
        "name": "嫩南瓜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 90
  },
  {
    "id": "nutrition_172",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "11分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "39g"
      },
      {
        "name": "嫩南瓜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 211
  },
  {
    "id": "nutrition_173",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "36分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "24g"
      },
      {
        "name": "嫩南瓜",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 192
  },
  {
    "id": "nutrition_174",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸汤。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "35分钟",
    "calories": "180卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "四季豆",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 202
  },
  {
    "id": "nutrition_175",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "28分钟",
    "calories": "180卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "36g"
      },
      {
        "name": "四季豆",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 206
  },
  {
    "id": "nutrition_176",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "26分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "四季豆",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 122
  },
  {
    "id": "nutrition_177",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "14分钟",
    "calories": "180卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "39g"
      },
      {
        "name": "四季豆",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 122
  },
  {
    "id": "nutrition_178",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "39分钟",
    "calories": "180卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "43g"
      },
      {
        "name": "四季豆",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 179
  },
  {
    "id": "nutrition_179",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "20分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "29g"
      },
      {
        "name": "山药",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 239
  },
  {
    "id": "nutrition_180",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "39分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "27g"
      },
      {
        "name": "山药",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 210
  },
  {
    "id": "nutrition_181",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "34分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "49g"
      },
      {
        "name": "山药",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 224
  },
  {
    "id": "nutrition_182",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮汤，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "38分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "43g"
      },
      {
        "name": "山药",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 89
  },
  {
    "id": "nutrition_183",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "13分钟",
    "calories": "200卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "42g"
      },
      {
        "name": "山药",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 200
  },
  {
    "id": "nutrition_184",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，汤清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "25分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "46g"
      },
      {
        "name": "山药",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 93
  },
  {
    "id": "nutrition_185",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "33分钟",
    "calories": "200卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "42g"
      },
      {
        "name": "山药",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 213
  },
  {
    "id": "nutrition_186",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "28分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "37g"
      },
      {
        "name": "山药",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 170
  },
  {
    "id": "nutrition_187",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "39分钟",
    "calories": "200卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "33g"
      },
      {
        "name": "山药",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 203
  },
  {
    "id": "nutrition_188",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "26分钟",
    "calories": "200卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "35g"
      },
      {
        "name": "山药",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 61
  },
  {
    "id": "nutrition_189",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "20分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "27g"
      },
      {
        "name": "白菜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 154
  },
  {
    "id": "nutrition_190",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "30分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "41g"
      },
      {
        "name": "白菜",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 96
  },
  {
    "id": "nutrition_191",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮粥。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "38分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "42g"
      },
      {
        "name": "白菜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 77
  },
  {
    "id": "nutrition_192",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "22分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "28g"
      },
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 50
  },
  {
    "id": "nutrition_193",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "31分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "29g"
      },
      {
        "name": "白菜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 172
  },
  {
    "id": "nutrition_194",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "34分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "38g"
      },
      {
        "name": "萝卜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 82
  },
  {
    "id": "nutrition_195",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "39分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "26g"
      },
      {
        "name": "萝卜",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 126
  },
  {
    "id": "nutrition_196",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "24分钟",
    "calories": "220卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "45g"
      },
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 181
  },
  {
    "id": "nutrition_197",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "22分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "31g"
      },
      {
        "name": "萝卜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 70
  },
  {
    "id": "nutrition_198",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "2-3岁"
    ],
    "ageRange": "2-3岁",
    "cookTime": "36分钟",
    "calories": "220卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "38g"
      },
      {
        "name": "萝卜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "8g",
      "carbs": "30g",
      "fat": "6g",
      "fiber": "3g"
    },
    "tips": "2-3岁宝宝食用时切成小块，注意软硬适中。",
    "viewCount": 182
  },
  {
    "id": "nutrition_199",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米粥，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "33分钟",
    "calories": "264卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "24g"
      },
      {
        "name": "萝卜",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 117
  },
  {
    "id": "nutrition_200",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，汤清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "11分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "38g"
      },
      {
        "name": "萝卜",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 207
  },
  {
    "id": "nutrition_201",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉饭，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "22分钟",
    "calories": "264卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "25g"
      },
      {
        "name": "萝卜",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 119
  },
  {
    "id": "nutrition_202",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "21分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "36g"
      },
      {
        "name": "萝卜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 102
  },
  {
    "id": "nutrition_203",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜粥，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "36分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "34g"
      },
      {
        "name": "萝卜",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 232
  },
  {
    "id": "nutrition_204",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "18分钟",
    "calories": "264卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "23g"
      },
      {
        "name": "豌豆苗",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 174
  },
  {
    "id": "nutrition_205",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "30分钟",
    "calories": "264卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "35g"
      },
      {
        "name": "豌豆苗",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 143
  },
  {
    "id": "nutrition_206",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "35分钟",
    "calories": "264卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "29g"
      },
      {
        "name": "豌豆苗",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 191
  },
  {
    "id": "nutrition_207",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "27分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "24g"
      },
      {
        "name": "豌豆苗",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 78
  },
  {
    "id": "nutrition_208",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "19分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "45g"
      },
      {
        "name": "豌豆苗",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 208
  },
  {
    "id": "nutrition_209",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "16分钟",
    "calories": "240卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "36g"
      },
      {
        "name": "春笋",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 139
  },
  {
    "id": "nutrition_210",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "11分钟",
    "calories": "240卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "34g"
      },
      {
        "name": "春笋",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 118
  },
  {
    "id": "nutrition_211",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "16分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "24g"
      },
      {
        "name": "春笋",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 164
  },
  {
    "id": "nutrition_212",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "11分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "26g"
      },
      {
        "name": "春笋",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 233
  },
  {
    "id": "nutrition_213",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "28分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "28g"
      },
      {
        "name": "春笋",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 63
  },
  {
    "id": "nutrition_214",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "12分钟",
    "calories": "240卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "42g"
      },
      {
        "name": "蕨菜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 124
  },
  {
    "id": "nutrition_215",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮粥，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "37分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "22g"
      },
      {
        "name": "蕨菜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 108
  },
  {
    "id": "nutrition_216",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮汤，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "15分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "30g"
      },
      {
        "name": "蕨菜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 182
  },
  {
    "id": "nutrition_217",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "16分钟",
    "calories": "240卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "25g"
      },
      {
        "name": "蕨菜",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 148
  },
  {
    "id": "nutrition_218",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "26分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "38g"
      },
      {
        "name": "蕨菜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 146
  },
  {
    "id": "nutrition_219",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "15分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "27g"
      },
      {
        "name": "四季豆",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 114
  },
  {
    "id": "nutrition_220",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "29分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "39g"
      },
      {
        "name": "四季豆",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 134
  },
  {
    "id": "nutrition_221",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮汤，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "19分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "34g"
      },
      {
        "name": "四季豆",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 84
  },
  {
    "id": "nutrition_222",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "18分钟",
    "calories": "240卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "48g"
      },
      {
        "name": "四季豆",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 72
  },
  {
    "id": "nutrition_223",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌饭，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "23分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "34g"
      },
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 148
  },
  {
    "id": "nutrition_224",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "37分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "33g"
      },
      {
        "name": "嫩南瓜",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 126
  },
  {
    "id": "nutrition_225",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花饭思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "35分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "45g"
      },
      {
        "name": "嫩南瓜",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 248
  },
  {
    "id": "nutrition_226",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "29分钟",
    "calories": "216卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "20g"
      },
      {
        "name": "嫩南瓜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 207
  },
  {
    "id": "nutrition_227",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "37分钟",
    "calories": "216卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "44g"
      },
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 117
  },
  {
    "id": "nutrition_228",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮汤，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "34分钟",
    "calories": "216卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "嫩南瓜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 184
  },
  {
    "id": "nutrition_229",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "39分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "42g"
      },
      {
        "name": "嫩南瓜",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 191
  },
  {
    "id": "nutrition_230",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮汤。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "11分钟",
    "calories": "216卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "39g"
      },
      {
        "name": "嫩南瓜",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 200
  },
  {
    "id": "nutrition_231",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "29分钟",
    "calories": "216卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "45g"
      },
      {
        "name": "嫩南瓜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 150
  },
  {
    "id": "nutrition_232",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "32分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "42g"
      },
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 210
  },
  {
    "id": "nutrition_233",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "19分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "24g"
      },
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 142
  },
  {
    "id": "nutrition_234",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸汤。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "13分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "34g"
      },
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 214
  },
  {
    "id": "nutrition_235",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "16分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "31g"
      },
      {
        "name": "四季豆",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 198
  },
  {
    "id": "nutrition_236",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "36分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "30g"
      },
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 79
  },
  {
    "id": "nutrition_237",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "31分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "26g"
      },
      {
        "name": "四季豆",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 194
  },
  {
    "id": "nutrition_238",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "31分钟",
    "calories": "216卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "44g"
      },
      {
        "name": "四季豆",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 238
  },
  {
    "id": "nutrition_239",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "15分钟",
    "calories": "240卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "45g"
      },
      {
        "name": "山药",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 220
  },
  {
    "id": "nutrition_240",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "13分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "37g"
      },
      {
        "name": "山药",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 212
  },
  {
    "id": "nutrition_241",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "16分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "43g"
      },
      {
        "name": "山药",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 75
  },
  {
    "id": "nutrition_242",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮汤，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "15分钟",
    "calories": "240卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "20g"
      },
      {
        "name": "山药",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 92
  },
  {
    "id": "nutrition_243",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "20分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "21g"
      },
      {
        "name": "山药",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 180
  },
  {
    "id": "nutrition_244",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，汤清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "12分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "45g"
      },
      {
        "name": "山药",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 104
  },
  {
    "id": "nutrition_245",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "11分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "30g"
      },
      {
        "name": "山药",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 75
  },
  {
    "id": "nutrition_246",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "13分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "26g"
      },
      {
        "name": "山药",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 81
  },
  {
    "id": "nutrition_247",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "21分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "48g"
      },
      {
        "name": "山药",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 230
  },
  {
    "id": "nutrition_248",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "29分钟",
    "calories": "240卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "46g"
      },
      {
        "name": "山药",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 245
  },
  {
    "id": "nutrition_249",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "38分钟",
    "calories": "264卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "白菜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 130
  },
  {
    "id": "nutrition_250",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "16分钟",
    "calories": "264卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "33g"
      },
      {
        "name": "白菜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 199
  },
  {
    "id": "nutrition_251",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮粥。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "26分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "白菜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 69
  },
  {
    "id": "nutrition_252",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "33分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "22g"
      },
      {
        "name": "白菜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 228
  },
  {
    "id": "nutrition_253",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "24分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "20g"
      },
      {
        "name": "白菜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 78
  },
  {
    "id": "nutrition_254",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "16分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "47g"
      },
      {
        "name": "萝卜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 116
  },
  {
    "id": "nutrition_255",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "29分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "48g"
      },
      {
        "name": "萝卜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 198
  },
  {
    "id": "nutrition_256",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "19分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "26g"
      },
      {
        "name": "萝卜",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 206
  },
  {
    "id": "nutrition_257",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "19分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "20g"
      },
      {
        "name": "萝卜",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 52
  },
  {
    "id": "nutrition_258",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "3-4岁"
    ],
    "ageRange": "3-4岁",
    "cookTime": "15分钟",
    "calories": "264卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "20g"
      },
      {
        "name": "萝卜",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "10g",
      "carbs": "35g",
      "fat": "7g",
      "fiber": "3g"
    },
    "tips": "3-4岁宝宝可尝试小块状，注意细嚼慢咽。",
    "viewCount": 59
  },
  {
    "id": "nutrition_259",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米粥，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "29分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "43g"
      },
      {
        "name": "萝卜",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 218
  },
  {
    "id": "nutrition_260",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，汤清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "13分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "萝卜",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 94
  },
  {
    "id": "nutrition_261",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉饭，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "13分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "萝卜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 169
  },
  {
    "id": "nutrition_262",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "32分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "42g"
      },
      {
        "name": "萝卜",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 100
  },
  {
    "id": "nutrition_263",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜粥，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "39分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "23g"
      },
      {
        "name": "萝卜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 97
  },
  {
    "id": "nutrition_264",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "12分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "33g"
      },
      {
        "name": "豌豆苗",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 81
  },
  {
    "id": "nutrition_265",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "21分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "40g"
      },
      {
        "name": "豌豆苗",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 55
  },
  {
    "id": "nutrition_266",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "34分钟",
    "calories": "308卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "38g"
      },
      {
        "name": "豌豆苗",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 129
  },
  {
    "id": "nutrition_267",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "19分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "33g"
      },
      {
        "name": "豌豆苗",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 51
  },
  {
    "id": "nutrition_268",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "24分钟",
    "calories": "308卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "47g"
      },
      {
        "name": "豌豆苗",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 106
  },
  {
    "id": "nutrition_269",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "22分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "35g"
      },
      {
        "name": "春笋",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 151
  },
  {
    "id": "nutrition_270",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "31分钟",
    "calories": "280卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "40g"
      },
      {
        "name": "春笋",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 86
  },
  {
    "id": "nutrition_271",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "10分钟",
    "calories": "280卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "36g"
      },
      {
        "name": "春笋",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 78
  },
  {
    "id": "nutrition_272",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "29分钟",
    "calories": "280卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "48g"
      },
      {
        "name": "春笋",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 245
  },
  {
    "id": "nutrition_273",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "21分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "23g"
      },
      {
        "name": "春笋",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 173
  },
  {
    "id": "nutrition_274",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "12分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "22g"
      },
      {
        "name": "蕨菜",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 125
  },
  {
    "id": "nutrition_275",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮粥，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "25分钟",
    "calories": "280卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "40g"
      },
      {
        "name": "蕨菜",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 85
  },
  {
    "id": "nutrition_276",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮汤，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "39分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "49g"
      },
      {
        "name": "蕨菜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 155
  },
  {
    "id": "nutrition_277",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "34分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "46g"
      },
      {
        "name": "蕨菜",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 126
  },
  {
    "id": "nutrition_278",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "21分钟",
    "calories": "280卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "33g"
      },
      {
        "name": "蕨菜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 91
  },
  {
    "id": "nutrition_279",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "18分钟",
    "calories": "280卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "四季豆",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 196
  },
  {
    "id": "nutrition_280",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "20分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "四季豆",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 234
  },
  {
    "id": "nutrition_281",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮汤，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "11分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "44g"
      },
      {
        "name": "四季豆",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 145
  },
  {
    "id": "nutrition_282",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "35分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "四季豆",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 204
  },
  {
    "id": "nutrition_283",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌饭，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "14分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "四季豆",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 92
  },
  {
    "id": "nutrition_284",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "15分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "34g"
      },
      {
        "name": "嫩南瓜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 89
  },
  {
    "id": "nutrition_285",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花饭思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "27分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "24g"
      },
      {
        "name": "嫩南瓜",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 60
  },
  {
    "id": "nutrition_286",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "18分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "嫩南瓜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 205
  },
  {
    "id": "nutrition_287",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "18分钟",
    "calories": "252卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "40g"
      },
      {
        "name": "嫩南瓜",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 208
  },
  {
    "id": "nutrition_288",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮汤，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "31分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "嫩南瓜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 62
  },
  {
    "id": "nutrition_289",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "13分钟",
    "calories": "252卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "嫩南瓜",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 77
  },
  {
    "id": "nutrition_290",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮汤。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "10分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "嫩南瓜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 61
  },
  {
    "id": "nutrition_291",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "18分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "21g"
      },
      {
        "name": "嫩南瓜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 215
  },
  {
    "id": "nutrition_292",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "33分钟",
    "calories": "252卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "27g"
      },
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 249
  },
  {
    "id": "nutrition_293",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "36分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 139
  },
  {
    "id": "nutrition_294",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸汤。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "24分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "29g"
      },
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 135
  },
  {
    "id": "nutrition_295",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "17分钟",
    "calories": "252卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "36g"
      },
      {
        "name": "四季豆",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 179
  },
  {
    "id": "nutrition_296",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "21分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "21g"
      },
      {
        "name": "四季豆",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 140
  },
  {
    "id": "nutrition_297",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "25分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "31g"
      },
      {
        "name": "四季豆",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 183
  },
  {
    "id": "nutrition_298",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "18分钟",
    "calories": "252卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "21g"
      },
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 153
  },
  {
    "id": "nutrition_299",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "25分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "28g"
      },
      {
        "name": "山药",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 66
  },
  {
    "id": "nutrition_300",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "11分钟",
    "calories": "280卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "46g"
      },
      {
        "name": "山药",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 193
  },
  {
    "id": "nutrition_301",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "20分钟",
    "calories": "280卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "48g"
      },
      {
        "name": "山药",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 243
  },
  {
    "id": "nutrition_302",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮汤，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "13分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "33g"
      },
      {
        "name": "山药",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 226
  },
  {
    "id": "nutrition_303",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "18分钟",
    "calories": "280卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "37g"
      },
      {
        "name": "山药",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 131
  },
  {
    "id": "nutrition_304",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，汤清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "20分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "23g"
      },
      {
        "name": "山药",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 107
  },
  {
    "id": "nutrition_305",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "38分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "36g"
      },
      {
        "name": "山药",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 205
  },
  {
    "id": "nutrition_306",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "19分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "32g"
      },
      {
        "name": "山药",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 77
  },
  {
    "id": "nutrition_307",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "33分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "31g"
      },
      {
        "name": "山药",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 212
  },
  {
    "id": "nutrition_308",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "37分钟",
    "calories": "280卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "38g"
      },
      {
        "name": "山药",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 90
  },
  {
    "id": "nutrition_309",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "31分钟",
    "calories": "308卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "41g"
      },
      {
        "name": "白菜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 107
  },
  {
    "id": "nutrition_310",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "15分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "39g"
      },
      {
        "name": "白菜",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 157
  },
  {
    "id": "nutrition_311",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮粥。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "10分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "25g"
      },
      {
        "name": "白菜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 99
  },
  {
    "id": "nutrition_312",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "15分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "29g"
      },
      {
        "name": "白菜",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 186
  },
  {
    "id": "nutrition_313",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "37分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "26g"
      },
      {
        "name": "白菜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 184
  },
  {
    "id": "nutrition_314",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "37分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "23g"
      },
      {
        "name": "萝卜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 161
  },
  {
    "id": "nutrition_315",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "13分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "29g"
      },
      {
        "name": "萝卜",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 229
  },
  {
    "id": "nutrition_316",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "36分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "39g"
      },
      {
        "name": "萝卜",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 200
  },
  {
    "id": "nutrition_317",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "28分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "26g"
      },
      {
        "name": "萝卜",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 56
  },
  {
    "id": "nutrition_318",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "4-5岁"
    ],
    "ageRange": "4-5岁",
    "cookTime": "32分钟",
    "calories": "308卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "45g"
      },
      {
        "name": "萝卜",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "12g",
      "carbs": "40g",
      "fat": "8g",
      "fiber": "4g"
    },
    "tips": "4-5岁幼儿接近成人饮食，注意少盐少油。",
    "viewCount": 69
  },
  {
    "id": "nutrition_319",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米粥，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "26分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "41g"
      },
      {
        "name": "萝卜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 61
  },
  {
    "id": "nutrition_320",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，汤清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "11分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 206
  },
  {
    "id": "nutrition_321",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉饭，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "12分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "31g"
      },
      {
        "name": "萝卜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 172
  },
  {
    "id": "nutrition_322",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "32分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "36g"
      },
      {
        "name": "萝卜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 219
  },
  {
    "id": "nutrition_323",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜粥，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "17分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "34g"
      },
      {
        "name": "萝卜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 148
  },
  {
    "id": "nutrition_324",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "33分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "38g"
      },
      {
        "name": "豌豆苗",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 249
  },
  {
    "id": "nutrition_325",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "11分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "28g"
      },
      {
        "name": "豌豆苗",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 56
  },
  {
    "id": "nutrition_326",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "39分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "22g"
      },
      {
        "name": "豌豆苗",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 91
  },
  {
    "id": "nutrition_327",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "34分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "48g"
      },
      {
        "name": "豌豆苗",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 67
  },
  {
    "id": "nutrition_328",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "28分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "26g"
      },
      {
        "name": "豌豆苗",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 98
  },
  {
    "id": "nutrition_329",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "10分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "35g"
      },
      {
        "name": "春笋",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 61
  },
  {
    "id": "nutrition_330",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "27分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "28g"
      },
      {
        "name": "春笋",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 110
  },
  {
    "id": "nutrition_331",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "20分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "34g"
      },
      {
        "name": "春笋",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 238
  },
  {
    "id": "nutrition_332",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "11分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "33g"
      },
      {
        "name": "春笋",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 174
  },
  {
    "id": "nutrition_333",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "38分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "22g"
      },
      {
        "name": "春笋",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 114
  },
  {
    "id": "nutrition_334",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "18分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "25g"
      },
      {
        "name": "蕨菜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 155
  },
  {
    "id": "nutrition_335",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮粥，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "35分钟",
    "calories": "320卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "22g"
      },
      {
        "name": "蕨菜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 193
  },
  {
    "id": "nutrition_336",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮汤，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "35分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "37g"
      },
      {
        "name": "蕨菜",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 58
  },
  {
    "id": "nutrition_337",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "14分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "38g"
      },
      {
        "name": "蕨菜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 172
  },
  {
    "id": "nutrition_338",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "21分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "42g"
      },
      {
        "name": "蕨菜",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 85
  },
  {
    "id": "nutrition_339",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "25分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "37g"
      },
      {
        "name": "四季豆",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 178
  },
  {
    "id": "nutrition_340",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "11分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "39g"
      },
      {
        "name": "四季豆",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 199
  },
  {
    "id": "nutrition_341",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮汤，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "32分钟",
    "calories": "320卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "四季豆",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 127
  },
  {
    "id": "nutrition_342",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "13分钟",
    "calories": "320卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "36g"
      },
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 135
  },
  {
    "id": "nutrition_343",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌饭，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "35分钟",
    "calories": "320卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "43g"
      },
      {
        "name": "四季豆",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 150
  },
  {
    "id": "nutrition_344",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "38分钟",
    "calories": "288卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "40g"
      },
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 206
  },
  {
    "id": "nutrition_345",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花饭思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "29分钟",
    "calories": "288卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "25g"
      },
      {
        "name": "嫩南瓜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 202
  },
  {
    "id": "nutrition_346",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "37分钟",
    "calories": "288卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "26g"
      },
      {
        "name": "嫩南瓜",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 77
  },
  {
    "id": "nutrition_347",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "30分钟",
    "calories": "288卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "41g"
      },
      {
        "name": "嫩南瓜",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 188
  },
  {
    "id": "nutrition_348",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮汤，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "21分钟",
    "calories": "288卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "26g"
      },
      {
        "name": "嫩南瓜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 176
  },
  {
    "id": "nutrition_349",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "27分钟",
    "calories": "288卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "嫩南瓜",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 162
  },
  {
    "id": "nutrition_350",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮汤。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "32分钟",
    "calories": "288卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "22g"
      },
      {
        "name": "嫩南瓜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 87
  },
  {
    "id": "nutrition_351",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "25分钟",
    "calories": "288卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "33g"
      },
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 78
  },
  {
    "id": "nutrition_352",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "39分钟",
    "calories": "288卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "48g"
      },
      {
        "name": "嫩南瓜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 210
  },
  {
    "id": "nutrition_353",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "15分钟",
    "calories": "288卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "25g"
      },
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 189
  },
  {
    "id": "nutrition_354",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸汤。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "25分钟",
    "calories": "288卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "21g"
      },
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 140
  },
  {
    "id": "nutrition_355",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "31分钟",
    "calories": "288卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "33g"
      },
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 151
  },
  {
    "id": "nutrition_356",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "38分钟",
    "calories": "288卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "30g"
      },
      {
        "name": "四季豆",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 159
  },
  {
    "id": "nutrition_357",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "35分钟",
    "calories": "288卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "24g"
      },
      {
        "name": "四季豆",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 182
  },
  {
    "id": "nutrition_358",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "17分钟",
    "calories": "288卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "48g"
      },
      {
        "name": "四季豆",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 235
  },
  {
    "id": "nutrition_359",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "29分钟",
    "calories": "320卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "23g"
      },
      {
        "name": "山药",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 240
  },
  {
    "id": "nutrition_360",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "16分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "36g"
      },
      {
        "name": "山药",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 126
  },
  {
    "id": "nutrition_361",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "12分钟",
    "calories": "320卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "22g"
      },
      {
        "name": "山药",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 125
  },
  {
    "id": "nutrition_362",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮汤，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "31分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "22g"
      },
      {
        "name": "山药",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 171
  },
  {
    "id": "nutrition_363",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "32分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "38g"
      },
      {
        "name": "山药",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 183
  },
  {
    "id": "nutrition_364",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，汤清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "10分钟",
    "calories": "320卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "23g"
      },
      {
        "name": "山药",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 223
  },
  {
    "id": "nutrition_365",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "32分钟",
    "calories": "320卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "25g"
      },
      {
        "name": "山药",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 86
  },
  {
    "id": "nutrition_366",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "36分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "30g"
      },
      {
        "name": "山药",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 165
  },
  {
    "id": "nutrition_367",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "16分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "39g"
      },
      {
        "name": "山药",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 166
  },
  {
    "id": "nutrition_368",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "34分钟",
    "calories": "320卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "33g"
      },
      {
        "name": "山药",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 61
  },
  {
    "id": "nutrition_369",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "31分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "47g"
      },
      {
        "name": "白菜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 176
  },
  {
    "id": "nutrition_370",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "15分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "25g"
      },
      {
        "name": "白菜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 187
  },
  {
    "id": "nutrition_371",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮粥。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "26分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "37g"
      },
      {
        "name": "白菜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 214
  },
  {
    "id": "nutrition_372",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "39分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "白菜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 209
  },
  {
    "id": "nutrition_373",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "36分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "49g"
      },
      {
        "name": "白菜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 207
  },
  {
    "id": "nutrition_374",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "32分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "45g"
      },
      {
        "name": "萝卜",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 175
  },
  {
    "id": "nutrition_375",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "36分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "32g"
      },
      {
        "name": "萝卜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 145
  },
  {
    "id": "nutrition_376",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "13分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "43g"
      },
      {
        "name": "萝卜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 85
  },
  {
    "id": "nutrition_377",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "32分钟",
    "calories": "352卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "20g"
      },
      {
        "name": "萝卜",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 120
  },
  {
    "id": "nutrition_378",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "5-6岁"
    ],
    "ageRange": "5-6岁",
    "cookTime": "13分钟",
    "calories": "352卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "20g"
      },
      {
        "name": "萝卜",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "14g",
      "carbs": "45g",
      "fat": "9g",
      "fiber": "4g"
    },
    "tips": "5-6岁幼儿注意营养均衡，控制零食摄入。",
    "viewCount": 84
  },
  {
    "id": "nutrition_379",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米粥，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "21分钟",
    "calories": "396卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "37g"
      },
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 83
  },
  {
    "id": "nutrition_380",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，汤清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "23分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "23g"
      },
      {
        "name": "萝卜",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 160
  },
  {
    "id": "nutrition_381",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉饭，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "19分钟",
    "calories": "396卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "36g"
      },
      {
        "name": "萝卜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 50
  },
  {
    "id": "nutrition_382",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "27分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "33g"
      },
      {
        "name": "萝卜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 168
  },
  {
    "id": "nutrition_383",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜粥，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "26分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "39g"
      },
      {
        "name": "萝卜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 224
  },
  {
    "id": "nutrition_384",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "19分钟",
    "calories": "396卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "43g"
      },
      {
        "name": "豌豆苗",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 124
  },
  {
    "id": "nutrition_385",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "20分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "42g"
      },
      {
        "name": "豌豆苗",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 216
  },
  {
    "id": "nutrition_386",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "37分钟",
    "calories": "396卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "49g"
      },
      {
        "name": "豌豆苗",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 209
  },
  {
    "id": "nutrition_387",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "27分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "28g"
      },
      {
        "name": "豌豆苗",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 231
  },
  {
    "id": "nutrition_388",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "32分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "41g"
      },
      {
        "name": "豌豆苗",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 142
  },
  {
    "id": "nutrition_389",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "28分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "25g"
      },
      {
        "name": "春笋",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 179
  },
  {
    "id": "nutrition_390",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "11分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "49g"
      },
      {
        "name": "春笋",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 144
  },
  {
    "id": "nutrition_391",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "34分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "43g"
      },
      {
        "name": "春笋",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 126
  },
  {
    "id": "nutrition_392",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "11分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "46g"
      },
      {
        "name": "春笋",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 122
  },
  {
    "id": "nutrition_393",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "28分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "30g"
      },
      {
        "name": "春笋",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 187
  },
  {
    "id": "nutrition_394",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "29分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "37g"
      },
      {
        "name": "蕨菜",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 119
  },
  {
    "id": "nutrition_395",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮粥，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "32分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "39g"
      },
      {
        "name": "蕨菜",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 116
  },
  {
    "id": "nutrition_396",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮汤，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "29分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "36g"
      },
      {
        "name": "蕨菜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 70
  },
  {
    "id": "nutrition_397",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "13分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "48g"
      },
      {
        "name": "蕨菜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 142
  },
  {
    "id": "nutrition_398",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "23分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "49g"
      },
      {
        "name": "蕨菜",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 168
  },
  {
    "id": "nutrition_399",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "30分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "31g"
      },
      {
        "name": "四季豆",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 79
  },
  {
    "id": "nutrition_400",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "21分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "37g"
      },
      {
        "name": "四季豆",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 179
  },
  {
    "id": "nutrition_401",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮汤，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "10分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "41g"
      },
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 133
  },
  {
    "id": "nutrition_402",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "37分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "四季豆",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 87
  },
  {
    "id": "nutrition_403",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌饭，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "10分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "48g"
      },
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 136
  },
  {
    "id": "nutrition_404",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "16分钟",
    "calories": "324卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "23g"
      },
      {
        "name": "嫩南瓜",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 61
  },
  {
    "id": "nutrition_405",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花饭思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "35分钟",
    "calories": "324卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "嫩南瓜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 111
  },
  {
    "id": "nutrition_406",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "33分钟",
    "calories": "324卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "23g"
      },
      {
        "name": "嫩南瓜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 70
  },
  {
    "id": "nutrition_407",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "13分钟",
    "calories": "324卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "25g"
      },
      {
        "name": "嫩南瓜",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 103
  },
  {
    "id": "nutrition_408",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮汤，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "21分钟",
    "calories": "324卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 187
  },
  {
    "id": "nutrition_409",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "23分钟",
    "calories": "324卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "嫩南瓜",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 212
  },
  {
    "id": "nutrition_410",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮汤。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "34分钟",
    "calories": "324卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "嫩南瓜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 148
  },
  {
    "id": "nutrition_411",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "26分钟",
    "calories": "324卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "42g"
      },
      {
        "name": "嫩南瓜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 108
  },
  {
    "id": "nutrition_412",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "10分钟",
    "calories": "324卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "34g"
      },
      {
        "name": "嫩南瓜",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 161
  },
  {
    "id": "nutrition_413",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "10分钟",
    "calories": "324卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "33g"
      },
      {
        "name": "嫩南瓜",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 165
  },
  {
    "id": "nutrition_414",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸汤。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "25分钟",
    "calories": "324卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "31g"
      },
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 172
  },
  {
    "id": "nutrition_415",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "20分钟",
    "calories": "324卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "32g"
      },
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 61
  },
  {
    "id": "nutrition_416",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "25分钟",
    "calories": "324卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "24g"
      },
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 110
  },
  {
    "id": "nutrition_417",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "22分钟",
    "calories": "324卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "35g"
      },
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 149
  },
  {
    "id": "nutrition_418",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "32分钟",
    "calories": "324卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "28g"
      },
      {
        "name": "四季豆",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 121
  },
  {
    "id": "nutrition_419",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "28分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "26g"
      },
      {
        "name": "山药",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 137
  },
  {
    "id": "nutrition_420",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "34分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "24g"
      },
      {
        "name": "山药",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 214
  },
  {
    "id": "nutrition_421",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "22分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "22g"
      },
      {
        "name": "山药",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 221
  },
  {
    "id": "nutrition_422",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮汤，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "20分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "24g"
      },
      {
        "name": "山药",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 122
  },
  {
    "id": "nutrition_423",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "31分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "31g"
      },
      {
        "name": "山药",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 105
  },
  {
    "id": "nutrition_424",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，汤清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "39分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "24g"
      },
      {
        "name": "山药",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 155
  },
  {
    "id": "nutrition_425",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "18分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "31g"
      },
      {
        "name": "山药",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 132
  },
  {
    "id": "nutrition_426",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "20分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "43g"
      },
      {
        "name": "山药",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 244
  },
  {
    "id": "nutrition_427",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "15分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "24g"
      },
      {
        "name": "山药",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 155
  },
  {
    "id": "nutrition_428",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "21分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "27g"
      },
      {
        "name": "山药",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 120
  },
  {
    "id": "nutrition_429",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "30分钟",
    "calories": "396卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "27g"
      },
      {
        "name": "白菜",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 50
  },
  {
    "id": "nutrition_430",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "37分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "49g"
      },
      {
        "name": "白菜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 134
  },
  {
    "id": "nutrition_431",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮粥。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "35分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "35g"
      },
      {
        "name": "白菜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 190
  },
  {
    "id": "nutrition_432",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "11分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "21g"
      },
      {
        "name": "白菜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 218
  },
  {
    "id": "nutrition_433",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "28分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "46g"
      },
      {
        "name": "白菜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 184
  },
  {
    "id": "nutrition_434",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "26分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "20g"
      },
      {
        "name": "萝卜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 218
  },
  {
    "id": "nutrition_435",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "30分钟",
    "calories": "396卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "29g"
      },
      {
        "name": "萝卜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 92
  },
  {
    "id": "nutrition_436",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "25分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "44g"
      },
      {
        "name": "萝卜",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 76
  },
  {
    "id": "nutrition_437",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "22分钟",
    "calories": "396卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "31g"
      },
      {
        "name": "萝卜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 229
  },
  {
    "id": "nutrition_438",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "6-7岁"
    ],
    "ageRange": "6-7岁",
    "cookTime": "29分钟",
    "calories": "396卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "45g"
      },
      {
        "name": "萝卜",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "16g",
      "carbs": "50g",
      "fat": "10g",
      "fiber": "5g"
    },
    "tips": "6-7岁儿童需增加蛋白质和钙质摄入。",
    "viewCount": 205
  },
  {
    "id": "nutrition_439",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米粥，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "37分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "34g"
      },
      {
        "name": "萝卜",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 205
  },
  {
    "id": "nutrition_440",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，汤清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "14分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "35g"
      },
      {
        "name": "萝卜",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 147
  },
  {
    "id": "nutrition_441",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉饭，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "25分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "42g"
      },
      {
        "name": "萝卜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 141
  },
  {
    "id": "nutrition_442",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "35分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "47g"
      },
      {
        "name": "萝卜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 192
  },
  {
    "id": "nutrition_443",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜粥，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "26分钟",
    "calories": "440卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "37g"
      },
      {
        "name": "萝卜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 227
  },
  {
    "id": "nutrition_444",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "36分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "39g"
      },
      {
        "name": "豌豆苗",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 241
  },
  {
    "id": "nutrition_445",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "11分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "32g"
      },
      {
        "name": "豌豆苗",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 109
  },
  {
    "id": "nutrition_446",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "24分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "20g"
      },
      {
        "name": "豌豆苗",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 118
  },
  {
    "id": "nutrition_447",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "29分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "39g"
      },
      {
        "name": "豌豆苗",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 77
  },
  {
    "id": "nutrition_448",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "29分钟",
    "calories": "440卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "48g"
      },
      {
        "name": "豌豆苗",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 188
  },
  {
    "id": "nutrition_449",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "32分钟",
    "calories": "400卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "25g"
      },
      {
        "name": "春笋",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 108
  },
  {
    "id": "nutrition_450",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "39分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "43g"
      },
      {
        "name": "春笋",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 69
  },
  {
    "id": "nutrition_451",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "15分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "45g"
      },
      {
        "name": "春笋",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 213
  },
  {
    "id": "nutrition_452",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "18分钟",
    "calories": "400卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "32g"
      },
      {
        "name": "春笋",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 237
  },
  {
    "id": "nutrition_453",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "25分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "34g"
      },
      {
        "name": "春笋",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 92
  },
  {
    "id": "nutrition_454",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "23分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "37g"
      },
      {
        "name": "蕨菜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 193
  },
  {
    "id": "nutrition_455",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮粥，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "34分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "21g"
      },
      {
        "name": "蕨菜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 201
  },
  {
    "id": "nutrition_456",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮汤，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "14分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "42g"
      },
      {
        "name": "蕨菜",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 238
  },
  {
    "id": "nutrition_457",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "38分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "21g"
      },
      {
        "name": "蕨菜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 139
  },
  {
    "id": "nutrition_458",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "24分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "29g"
      },
      {
        "name": "蕨菜",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 58
  },
  {
    "id": "nutrition_459",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "15分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "四季豆",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 141
  },
  {
    "id": "nutrition_460",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "15分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "42g"
      },
      {
        "name": "四季豆",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 157
  },
  {
    "id": "nutrition_461",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮汤，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "20分钟",
    "calories": "400卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "41g"
      },
      {
        "name": "四季豆",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 103
  },
  {
    "id": "nutrition_462",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "29分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "26g"
      },
      {
        "name": "四季豆",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 226
  },
  {
    "id": "nutrition_463",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌饭，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "27分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "30g"
      },
      {
        "name": "四季豆",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 69
  },
  {
    "id": "nutrition_464",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "34分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 84
  },
  {
    "id": "nutrition_465",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花饭思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "13分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 87
  },
  {
    "id": "nutrition_466",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "17分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "嫩南瓜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 128
  },
  {
    "id": "nutrition_467",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "11分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "40g"
      },
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 165
  },
  {
    "id": "nutrition_468",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮汤，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "22分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "40g"
      },
      {
        "name": "嫩南瓜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 160
  },
  {
    "id": "nutrition_469",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "34分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "43g"
      },
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 234
  },
  {
    "id": "nutrition_470",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮汤。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "20分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "28g"
      },
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 181
  },
  {
    "id": "nutrition_471",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "19分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "48g"
      },
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 180
  },
  {
    "id": "nutrition_472",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "19分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "30g"
      },
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 101
  },
  {
    "id": "nutrition_473",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "23分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "49g"
      },
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 153
  },
  {
    "id": "nutrition_474",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸汤。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "20分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "32g"
      },
      {
        "name": "四季豆",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 78
  },
  {
    "id": "nutrition_475",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "37分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "41g"
      },
      {
        "name": "四季豆",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 100
  },
  {
    "id": "nutrition_476",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "36分钟",
    "calories": "360卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "28g"
      },
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 219
  },
  {
    "id": "nutrition_477",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "12分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "33g"
      },
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 125
  },
  {
    "id": "nutrition_478",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "10分钟",
    "calories": "360卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "38g"
      },
      {
        "name": "四季豆",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 179
  },
  {
    "id": "nutrition_479",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "38分钟",
    "calories": "400卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "35g"
      },
      {
        "name": "山药",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 187
  },
  {
    "id": "nutrition_480",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "37分钟",
    "calories": "400卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "21g"
      },
      {
        "name": "山药",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 249
  },
  {
    "id": "nutrition_481",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "31分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "23g"
      },
      {
        "name": "山药",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 248
  },
  {
    "id": "nutrition_482",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮汤，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "26分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "23g"
      },
      {
        "name": "山药",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 158
  },
  {
    "id": "nutrition_483",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "18分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "27g"
      },
      {
        "name": "山药",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 143
  },
  {
    "id": "nutrition_484",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，汤清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "27分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "46g"
      },
      {
        "name": "山药",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 103
  },
  {
    "id": "nutrition_485",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "37分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "41g"
      },
      {
        "name": "山药",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 134
  },
  {
    "id": "nutrition_486",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "38分钟",
    "calories": "400卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "24g"
      },
      {
        "name": "山药",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 124
  },
  {
    "id": "nutrition_487",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "24分钟",
    "calories": "400卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "29g"
      },
      {
        "name": "山药",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 135
  },
  {
    "id": "nutrition_488",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "18分钟",
    "calories": "400卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "27g"
      },
      {
        "name": "山药",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 238
  },
  {
    "id": "nutrition_489",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "36分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "38g"
      },
      {
        "name": "白菜",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 102
  },
  {
    "id": "nutrition_490",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "29分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "34g"
      },
      {
        "name": "白菜",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 187
  },
  {
    "id": "nutrition_491",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮粥。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "30分钟",
    "calories": "440卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "27g"
      },
      {
        "name": "白菜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 208
  },
  {
    "id": "nutrition_492",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "34分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "33g"
      },
      {
        "name": "白菜",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 171
  },
  {
    "id": "nutrition_493",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "29分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "26g"
      },
      {
        "name": "白菜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 135
  },
  {
    "id": "nutrition_494",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "23分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "42g"
      },
      {
        "name": "萝卜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 112
  },
  {
    "id": "nutrition_495",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "33分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "31g"
      },
      {
        "name": "萝卜",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 51
  },
  {
    "id": "nutrition_496",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "21分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "48g"
      },
      {
        "name": "萝卜",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 77
  },
  {
    "id": "nutrition_497",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "33分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "44g"
      },
      {
        "name": "萝卜",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 127
  },
  {
    "id": "nutrition_498",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "7-8岁"
    ],
    "ageRange": "7-8岁",
    "cookTime": "36分钟",
    "calories": "440卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "27g"
      },
      {
        "name": "萝卜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "18g",
      "carbs": "55g",
      "fat": "11g",
      "fiber": "5g"
    },
    "tips": "7-8岁儿童活动量大，需保证足够能量。",
    "viewCount": 221
  },
  {
    "id": "nutrition_499",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米粥，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "33分钟",
    "calories": "528卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "萝卜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 130
  },
  {
    "id": "nutrition_500",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，汤清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "27分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "27g"
      },
      {
        "name": "萝卜",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 239
  },
  {
    "id": "nutrition_501",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉饭，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "38分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "萝卜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 159
  },
  {
    "id": "nutrition_502",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "32分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "24g"
      },
      {
        "name": "萝卜",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 115
  },
  {
    "id": "nutrition_503",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜粥，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "21分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "30g"
      },
      {
        "name": "萝卜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 145
  },
  {
    "id": "nutrition_504",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "18分钟",
    "calories": "528卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "23g"
      },
      {
        "name": "豌豆苗",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 225
  },
  {
    "id": "nutrition_505",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "16分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "24g"
      },
      {
        "name": "豌豆苗",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 160
  },
  {
    "id": "nutrition_506",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "12分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "45g"
      },
      {
        "name": "豌豆苗",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 161
  },
  {
    "id": "nutrition_507",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "39分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "34g"
      },
      {
        "name": "豌豆苗",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 227
  },
  {
    "id": "nutrition_508",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "39分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "27g"
      },
      {
        "name": "豌豆苗",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 191
  },
  {
    "id": "nutrition_509",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "29分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "35g"
      },
      {
        "name": "春笋",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 179
  },
  {
    "id": "nutrition_510",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "19分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "21g"
      },
      {
        "name": "春笋",
        "amount": "45g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 177
  },
  {
    "id": "nutrition_511",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "34分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "46g"
      },
      {
        "name": "春笋",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 233
  },
  {
    "id": "nutrition_512",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "20分钟",
    "calories": "480卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "49g"
      },
      {
        "name": "春笋",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 138
  },
  {
    "id": "nutrition_513",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "28分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "31g"
      },
      {
        "name": "春笋",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 190
  },
  {
    "id": "nutrition_514",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "12分钟",
    "calories": "480卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "31g"
      },
      {
        "name": "蕨菜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 127
  },
  {
    "id": "nutrition_515",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮粥，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "35分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "32g"
      },
      {
        "name": "蕨菜",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 113
  },
  {
    "id": "nutrition_516",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮汤，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "17分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "46g"
      },
      {
        "name": "蕨菜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 51
  },
  {
    "id": "nutrition_517",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "30分钟",
    "calories": "480卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "25g"
      },
      {
        "name": "蕨菜",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 198
  },
  {
    "id": "nutrition_518",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "18分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "48g"
      },
      {
        "name": "蕨菜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 157
  },
  {
    "id": "nutrition_519",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "21分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "45g"
      },
      {
        "name": "四季豆",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 145
  },
  {
    "id": "nutrition_520",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "18分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "30g"
      },
      {
        "name": "四季豆",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 209
  },
  {
    "id": "nutrition_521",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮汤，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "22分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "20g"
      },
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 81
  },
  {
    "id": "nutrition_522",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "34分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "23g"
      },
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 119
  },
  {
    "id": "nutrition_523",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌饭，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "34分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "43g"
      },
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 128
  },
  {
    "id": "nutrition_524",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "26分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "45g"
      },
      {
        "name": "嫩南瓜",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 231
  },
  {
    "id": "nutrition_525",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花饭思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "25分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "41g"
      },
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 199
  },
  {
    "id": "nutrition_526",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "24分钟",
    "calories": "432卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "20g"
      },
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 224
  },
  {
    "id": "nutrition_527",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "10分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "嫩南瓜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 228
  },
  {
    "id": "nutrition_528",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮汤，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "14分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "49g"
      },
      {
        "name": "嫩南瓜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 198
  },
  {
    "id": "nutrition_529",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "26分钟",
    "calories": "432卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "21g"
      },
      {
        "name": "嫩南瓜",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 179
  },
  {
    "id": "nutrition_530",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮汤。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "38分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "36g"
      },
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 249
  },
  {
    "id": "nutrition_531",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "33分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "26g"
      },
      {
        "name": "嫩南瓜",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 113
  },
  {
    "id": "nutrition_532",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "38分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "22g"
      },
      {
        "name": "嫩南瓜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 217
  },
  {
    "id": "nutrition_533",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "29分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "25g"
      },
      {
        "name": "嫩南瓜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 189
  },
  {
    "id": "nutrition_534",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸汤。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "39分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "48g"
      },
      {
        "name": "四季豆",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 208
  },
  {
    "id": "nutrition_535",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "26分钟",
    "calories": "432卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "38g"
      },
      {
        "name": "四季豆",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 179
  },
  {
    "id": "nutrition_536",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "37分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "46g"
      },
      {
        "name": "四季豆",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 183
  },
  {
    "id": "nutrition_537",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "26分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "20g"
      },
      {
        "name": "四季豆",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 157
  },
  {
    "id": "nutrition_538",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "36分钟",
    "calories": "432卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "四季豆",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 243
  },
  {
    "id": "nutrition_539",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "15分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "34g"
      },
      {
        "name": "山药",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 163
  },
  {
    "id": "nutrition_540",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "27分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "40g"
      },
      {
        "name": "山药",
        "amount": "34g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 168
  },
  {
    "id": "nutrition_541",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "26分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "43g"
      },
      {
        "name": "山药",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 141
  },
  {
    "id": "nutrition_542",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮汤，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "11分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "24g"
      },
      {
        "name": "山药",
        "amount": "30g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 79
  },
  {
    "id": "nutrition_543",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "24分钟",
    "calories": "480卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "49g"
      },
      {
        "name": "山药",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 178
  },
  {
    "id": "nutrition_544",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，汤清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "20分钟",
    "calories": "480卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "45g"
      },
      {
        "name": "山药",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 153
  },
  {
    "id": "nutrition_545",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "36分钟",
    "calories": "480卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "34g"
      },
      {
        "name": "山药",
        "amount": "46g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 185
  },
  {
    "id": "nutrition_546",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "11分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "32g"
      },
      {
        "name": "山药",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 73
  },
  {
    "id": "nutrition_547",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "25分钟",
    "calories": "480卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "24g"
      },
      {
        "name": "山药",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 226
  },
  {
    "id": "nutrition_548",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "13分钟",
    "calories": "480卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "33g"
      },
      {
        "name": "山药",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 226
  },
  {
    "id": "nutrition_549",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "28分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "32g"
      },
      {
        "name": "白菜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 180
  },
  {
    "id": "nutrition_550",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "27分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "20g"
      },
      {
        "name": "白菜",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 54
  },
  {
    "id": "nutrition_551",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮粥。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "30分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "36g"
      },
      {
        "name": "白菜",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 151
  },
  {
    "id": "nutrition_552",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "36分钟",
    "calories": "528卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "36g"
      },
      {
        "name": "白菜",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 191
  },
  {
    "id": "nutrition_553",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "13分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "45g"
      },
      {
        "name": "白菜",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 211
  },
  {
    "id": "nutrition_554",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "31分钟",
    "calories": "528卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "47g"
      },
      {
        "name": "萝卜",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 59
  },
  {
    "id": "nutrition_555",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "22分钟",
    "calories": "528卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "20g"
      },
      {
        "name": "萝卜",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 233
  },
  {
    "id": "nutrition_556",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "15分钟",
    "calories": "528卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "29g"
      },
      {
        "name": "萝卜",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 194
  },
  {
    "id": "nutrition_557",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "28分钟",
    "calories": "528卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "27g"
      },
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 134
  },
  {
    "id": "nutrition_558",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "8-12岁"
    ],
    "ageRange": "8-12岁",
    "cookTime": "24分钟",
    "calories": "528卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "47g"
      },
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "22g",
      "carbs": "65g",
      "fat": "13g",
      "fiber": "6g"
    },
    "tips": "8-12岁儿童注意荤素搭配，避免偏食。",
    "viewCount": 217
  },
  {
    "id": "nutrition_559",
    "title": "豆米白菜粥",
    "name": "豆米白菜粥",
    "description": "贵州冬季家常豆米粥，加入白菜丝，暖胃又易消化。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆米",
      "白菜",
      "暖胃",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "10分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "44g"
      },
      {
        "name": "萝卜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 122
  },
  {
    "id": "nutrition_560",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "冬季萝卜炖排骨，汤清味鲜，补充钙质。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "排骨",
      "补钙",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "25分钟",
    "calories": "572卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "24g"
      },
      {
        "name": "萝卜",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 141
  },
  {
    "id": "nutrition_561",
    "title": "腊肉土豆饭",
    "name": "腊肉土豆饭",
    "description": "贵州冬季传统腊肉饭，减少腊肉用量，搭配土豆更温和。",
    "category": "午餐",
    "tags": [
      "冬季",
      "腊肉",
      "土豆",
      "贵州特色",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "11分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "21g"
      },
      {
        "name": "萝卜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 102
  },
  {
    "id": "nutrition_562",
    "title": "豆腐脑蒸蛋",
    "name": "豆腐脑蒸蛋",
    "description": "嫩豆腐和鸡蛋混合蒸制，口感滑嫩，补充优质蛋白。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "37分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "45g"
      },
      {
        "name": "萝卜",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 226
  },
  {
    "id": "nutrition_563",
    "title": "红糖姜枣小米粥",
    "name": "红糖姜枣小米粥",
    "description": "冬季暖胃甜粥，红枣和姜片温和。",
    "category": "早餐",
    "tags": [
      "冬季",
      "红糖",
      "红枣",
      "暖胃",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "15分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "39g"
      },
      {
        "name": "萝卜",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 170
  },
  {
    "id": "nutrition_564",
    "title": "春笋肉末豆腐",
    "name": "春笋肉末豆腐",
    "description": "早春春笋鲜嫩，搭配肉末和豆腐。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "豆腐",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "39分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "45g"
      },
      {
        "name": "豌豆苗",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 241
  },
  {
    "id": "nutrition_565",
    "title": "豌豆苗鸡蛋汤",
    "name": "豌豆苗鸡蛋汤",
    "description": "春季豌豆苗清新，和鸡蛋煮成汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "鸡蛋",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "18分钟",
    "calories": "572卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "27g"
      },
      {
        "name": "豌豆苗",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 65
  },
  {
    "id": "nutrition_566",
    "title": "韭菜鸡蛋饺子",
    "name": "韭菜鸡蛋饺子",
    "description": "春季韭菜最香，做成饺子小份装。",
    "category": "午餐",
    "tags": [
      "春季",
      "韭菜",
      "鸡蛋",
      "主食",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "27分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "40g"
      },
      {
        "name": "豌豆苗",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 106
  },
  {
    "id": "nutrition_567",
    "title": "蕨菜炒蛋",
    "name": "蕨菜炒蛋",
    "description": "春季蕨菜嫩芽，焯水后和鸡蛋同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "蕨菜",
      "鸡蛋",
      "山野",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "12分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "42g"
      },
      {
        "name": "豌豆苗",
        "amount": "33g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 179
  },
  {
    "id": "nutrition_568",
    "title": "香椿拌豆腐",
    "name": "香椿拌豆腐",
    "description": "早春香椿嫩芽，和豆腐凉拌。",
    "category": "午餐",
    "tags": [
      "春季",
      "香椿",
      "豆腐",
      "尝鲜",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "38分钟",
    "calories": "572卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "34g"
      },
      {
        "name": "豌豆苗",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "豌豆苗准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充初春营养，豌豆苗增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 172
  },
  {
    "id": "nutrition_569",
    "title": "豌豆肉末饭",
    "name": "豌豆肉末饭",
    "description": "春季豌豆鲜甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春季",
      "豌豆",
      "肉末",
      "主食",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "23分钟",
    "calories": "520卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "37g"
      },
      {
        "name": "春笋",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 91
  },
  {
    "id": "nutrition_570",
    "title": "豆花面",
    "name": "豆花面",
    "description": "贵阳特色豆花面，儿童版清淡。",
    "category": "午餐",
    "tags": [
      "春季",
      "豆花",
      "贵阳特色",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "29分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "38g"
      },
      {
        "name": "春笋",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 50
  },
  {
    "id": "nutrition_571",
    "title": "菠菜鸡蛋饼",
    "name": "菠菜鸡蛋饼",
    "description": "春季菠菜嫩绿，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "春季",
      "菠菜",
      "鸡蛋",
      "补铁",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "25分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "49g"
      },
      {
        "name": "春笋",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 214
  },
  {
    "id": "nutrition_572",
    "title": "荠菜豆腐汤",
    "name": "荠菜豆腐汤",
    "description": "春季荠菜清香，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "春季",
      "荠菜",
      "豆腐",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "36分钟",
    "calories": "520卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "21g"
      },
      {
        "name": "春笋",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 202
  },
  {
    "id": "nutrition_573",
    "title": "芦笋鸡肉丝",
    "name": "芦笋鸡肉丝",
    "description": "春季芦笋鲜嫩，和鸡丝同炒。",
    "category": "午餐",
    "tags": [
      "春季",
      "芦笋",
      "鸡肉",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "36分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "香椿",
        "amount": "48g"
      },
      {
        "name": "春笋",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "香椿洗净处理",
      "春笋准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "香椿补充春季营养，春笋增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 149
  },
  {
    "id": "nutrition_574",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "四月嫩南瓜清甜，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "春季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "20分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "30g"
      },
      {
        "name": "蕨菜",
        "amount": "25g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 207
  },
  {
    "id": "nutrition_575",
    "title": "蕨菜肉末粥",
    "name": "蕨菜肉末粥",
    "description": "春季蕨菜和肉末煮粥，山野清香。",
    "category": "早餐",
    "tags": [
      "春季",
      "蕨菜",
      "肉末",
      "山野",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "35分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "30g"
      },
      {
        "name": "蕨菜",
        "amount": "48g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 220
  },
  {
    "id": "nutrition_576",
    "title": "豌豆苗豆腐汤",
    "name": "豌豆苗豆腐汤",
    "description": "豌豆苗和嫩豆腐煮汤，清新爽口。",
    "category": "汤品",
    "tags": [
      "春季",
      "豌豆苗",
      "豆腐",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "20分钟",
    "calories": "520卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "32g"
      },
      {
        "name": "蕨菜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 178
  },
  {
    "id": "nutrition_577",
    "title": "春笋鸡肉丝",
    "name": "春笋鸡肉丝",
    "description": "春笋和鸡丝同炒，春季鲜美。",
    "category": "午餐",
    "tags": [
      "春季",
      "春笋",
      "鸡肉",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "15分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "34g"
      },
      {
        "name": "蕨菜",
        "amount": "23g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 214
  },
  {
    "id": "nutrition_578",
    "title": "豆花蒸蛋",
    "name": "豆花蒸蛋",
    "description": "嫩豆花和鸡蛋蒸制，双重蛋白。",
    "category": "早餐",
    "tags": [
      "春季",
      "豆花",
      "鸡蛋",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "25分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "春笋",
        "amount": "30g"
      },
      {
        "name": "蕨菜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "春笋洗净处理",
      "蕨菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "春笋补充春季营养，蕨菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 218
  },
  {
    "id": "nutrition_579",
    "title": "四季豆肉末饭",
    "name": "四季豆肉末饭",
    "description": "五月四季豆鲜嫩，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "春夏",
      "四季豆",
      "肉末",
      "主食",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "27分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "44g"
      },
      {
        "name": "四季豆",
        "amount": "44g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 64
  },
  {
    "id": "nutrition_580",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，清甜软糯。",
    "category": "早餐",
    "tags": [
      "春夏",
      "嫩南瓜",
      "粥",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "39分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "23g"
      },
      {
        "name": "四季豆",
        "amount": "29g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 124
  },
  {
    "id": "nutrition_581",
    "title": "豌豆豆腐汤",
    "name": "豌豆豆腐汤",
    "description": "豌豆和豆腐煮汤，清爽营养。",
    "category": "汤品",
    "tags": [
      "春夏",
      "豌豆",
      "豆腐",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "39分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "21g"
      },
      {
        "name": "四季豆",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 118
  },
  {
    "id": "nutrition_582",
    "title": "蕨菜鸡肉丝",
    "name": "蕨菜鸡肉丝",
    "description": "蕨菜和鸡丝同炒，春夏鲜味。",
    "category": "午餐",
    "tags": [
      "春夏",
      "蕨菜",
      "鸡肉",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "17分钟",
    "calories": "520卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "21g"
      },
      {
        "name": "四季豆",
        "amount": "40g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 231
  },
  {
    "id": "nutrition_583",
    "title": "豆花拌饭",
    "name": "豆花拌饭",
    "description": "嫩豆花拌饭，简单营养。",
    "category": "午餐",
    "tags": [
      "春夏",
      "豆花",
      "米饭",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "26分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "39g"
      },
      {
        "name": "四季豆",
        "amount": "20g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充春夏营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 103
  },
  {
    "id": "nutrition_584",
    "title": "素瓜豆清汤粉",
    "name": "素瓜豆清汤粉",
    "description": "参考贵阳夏季素瓜豆，嫩南瓜和四季豆清甜。",
    "category": "午餐",
    "tags": [
      "夏季",
      "素瓜豆",
      "清爽",
      "补水",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "17分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "41g"
      },
      {
        "name": "嫩南瓜",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 206
  },
  {
    "id": "nutrition_585",
    "title": "番茄酸汤豆花饭",
    "name": "番茄酸汤豆花饭",
    "description": "贵州豆花饭思路改成儿童友好版。",
    "category": "午餐",
    "tags": [
      "夏季",
      "豆花饭",
      "酸汤",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "10分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "24g"
      },
      {
        "name": "嫩南瓜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 240
  },
  {
    "id": "nutrition_586",
    "title": "毛豆肉末粥",
    "name": "毛豆肉末粥",
    "description": "夏季毛豆鲜甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "夏季",
      "毛豆",
      "肉末",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "16分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "39g"
      },
      {
        "name": "嫩南瓜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 79
  },
  {
    "id": "nutrition_587",
    "title": "嫩南瓜蒸蛋",
    "name": "嫩南瓜蒸蛋",
    "description": "嫩南瓜和鸡蛋蒸制，夏季清爽。",
    "category": "早餐",
    "tags": [
      "夏季",
      "嫩南瓜",
      "鸡蛋",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "25分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "嫩南瓜",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 57
  },
  {
    "id": "nutrition_588",
    "title": "四季豆豆腐汤",
    "name": "四季豆豆腐汤",
    "description": "四季豆和豆腐煮汤，清淡解暑。",
    "category": "汤品",
    "tags": [
      "夏季",
      "四季豆",
      "豆腐",
      "解暑",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "29分钟",
    "calories": "468卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "33g"
      },
      {
        "name": "嫩南瓜",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 122
  },
  {
    "id": "nutrition_589",
    "title": "豌豆凉粉鸡丝碗",
    "name": "豌豆凉粉鸡丝碗",
    "description": "参考贵阳夏日豌豆凉粉，加入鸡丝和黄瓜丝。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豌豆凉粉",
      "鸡丝",
      "清凉",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "24分钟",
    "calories": "468卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "31g"
      },
      {
        "name": "嫩南瓜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 179
  },
  {
    "id": "nutrition_590",
    "title": "苦瓜鸡蛋汤",
    "name": "苦瓜鸡蛋汤",
    "description": "夏季苦瓜清热，和鸡蛋煮汤。",
    "category": "汤品",
    "tags": [
      "夏季",
      "苦瓜",
      "鸡蛋",
      "清热",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "12分钟",
    "calories": "468卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "39g"
      },
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 140
  },
  {
    "id": "nutrition_591",
    "title": "茄子肉末饭",
    "name": "茄子肉末饭",
    "description": "夏季茄子软糯，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "夏季",
      "茄子",
      "肉末",
      "主食",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "18分钟",
    "calories": "468卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "48g"
      },
      {
        "name": "嫩南瓜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 101
  },
  {
    "id": "nutrition_592",
    "title": "豆花拌黄瓜",
    "name": "豆花拌黄瓜",
    "description": "嫩豆花和黄瓜凉拌，夏季清爽。",
    "category": "加餐",
    "tags": [
      "夏季",
      "豆花",
      "黄瓜",
      "清爽",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "15分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "48g"
      },
      {
        "name": "嫩南瓜",
        "amount": "22g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 183
  },
  {
    "id": "nutrition_593",
    "title": "四季豆蒸蛋",
    "name": "四季豆蒸蛋",
    "description": "四季豆和鸡蛋蒸制，夏季清淡。",
    "category": "早餐",
    "tags": [
      "夏季",
      "四季豆",
      "鸡蛋",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "37分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "四季豆",
        "amount": "29g"
      },
      {
        "name": "嫩南瓜",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "四季豆洗净处理",
      "嫩南瓜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "四季豆补充夏季营养，嫩南瓜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 123
  },
  {
    "id": "nutrition_594",
    "title": "木姜子冬瓜丸子汤",
    "name": "木姜子冬瓜丸子汤",
    "description": "木姜子是黔味特色香气，少量点缀冬瓜肉丸汤。",
    "category": "汤品",
    "tags": [
      "夏秋",
      "木姜子",
      "冬瓜",
      "清爽",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "39分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "35g"
      },
      {
        "name": "四季豆",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 197
  },
  {
    "id": "nutrition_595",
    "title": "黄瓜鸡蛋饼",
    "name": "黄瓜鸡蛋饼",
    "description": "夏季黄瓜清爽，和鸡蛋做成软饼。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "黄瓜",
      "鸡蛋",
      "清爽",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "18分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "20g"
      },
      {
        "name": "四季豆",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 213
  },
  {
    "id": "nutrition_596",
    "title": "茄子豆腐煲",
    "name": "茄子豆腐煲",
    "description": "茄子和豆腐同煲，夏秋温和。",
    "category": "晚餐",
    "tags": [
      "夏秋",
      "茄子",
      "豆腐",
      "温和",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "14分钟",
    "calories": "468卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "20g"
      },
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 245
  },
  {
    "id": "nutrition_597",
    "title": "嫩南瓜粥",
    "name": "嫩南瓜粥",
    "description": "嫩南瓜煮粥，夏秋清甜。",
    "category": "早餐",
    "tags": [
      "夏秋",
      "嫩南瓜",
      "粥",
      "清甜",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "18分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "47g"
      },
      {
        "name": "四季豆",
        "amount": "39g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 100
  },
  {
    "id": "nutrition_598",
    "title": "四季豆鸡肉丝",
    "name": "四季豆鸡肉丝",
    "description": "四季豆和鸡丝同炒，夏秋鲜味。",
    "category": "午餐",
    "tags": [
      "夏秋",
      "四季豆",
      "鸡肉",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "17分钟",
    "calories": "468卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "嫩南瓜",
        "amount": "23g"
      },
      {
        "name": "四季豆",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "嫩南瓜洗净处理",
      "四季豆准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "嫩南瓜补充夏秋营养，四季豆增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 193
  },
  {
    "id": "nutrition_599",
    "title": "板栗山药鸡汤",
    "name": "板栗山药鸡汤",
    "description": "秋季板栗成熟时做温和鸡汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "板栗",
      "山药",
      "换季",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "26分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "31g"
      },
      {
        "name": "山药",
        "amount": "24g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 150
  },
  {
    "id": "nutrition_600",
    "title": "莲藕肉末粥",
    "name": "莲藕肉末粥",
    "description": "秋季莲藕脆甜，和肉末煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "莲藕",
      "肉末",
      "换季",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "33分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "35g"
      },
      {
        "name": "山药",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 171
  },
  {
    "id": "nutrition_601",
    "title": "红薯蒸蛋",
    "name": "红薯蒸蛋",
    "description": "秋季红薯甜糯，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "鸡蛋",
      "换季",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "34分钟",
    "calories": "520卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "32g"
      },
      {
        "name": "山药",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 106
  },
  {
    "id": "nutrition_602",
    "title": "山药豆腐汤",
    "name": "山药豆腐汤",
    "description": "山药和豆腐煮汤，秋季温和。",
    "category": "汤品",
    "tags": [
      "秋季",
      "山药",
      "豆腐",
      "温和",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "35分钟",
    "calories": "520卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "43g"
      },
      {
        "name": "山药",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 134
  },
  {
    "id": "nutrition_603",
    "title": "板栗鸡肉饭",
    "name": "板栗鸡肉饭",
    "description": "板栗和鸡肉米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "鸡肉",
      "温补",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "35分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "46g"
      },
      {
        "name": "山药",
        "amount": "26g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 234
  },
  {
    "id": "nutrition_604",
    "title": "萝卜排骨汤",
    "name": "萝卜排骨汤",
    "description": "秋季萝卜炖排骨，汤清味鲜。",
    "category": "汤品",
    "tags": [
      "秋季",
      "萝卜",
      "排骨",
      "补钙",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "18分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "23g"
      },
      {
        "name": "山药",
        "amount": "27g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 107
  },
  {
    "id": "nutrition_605",
    "title": "红薯小米粥",
    "name": "红薯小米粥",
    "description": "秋季红薯甜糯，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "秋季",
      "红薯",
      "小米",
      "暖胃",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "12分钟",
    "calories": "520卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "29g"
      },
      {
        "name": "山药",
        "amount": "41g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 68
  },
  {
    "id": "nutrition_606",
    "title": "山药鸡肉丝",
    "name": "山药鸡肉丝",
    "description": "山药和鸡丝同炒，秋季温和。",
    "category": "午餐",
    "tags": [
      "秋季",
      "山药",
      "鸡肉",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "21分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "25g"
      },
      {
        "name": "山药",
        "amount": "37g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 88
  },
  {
    "id": "nutrition_607",
    "title": "白菜豆腐汤",
    "name": "白菜豆腐汤",
    "description": "秋季白菜清甜，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋季",
      "白菜",
      "豆腐",
      "清淡",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "14分钟",
    "calories": "520卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "20g"
      },
      {
        "name": "山药",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 179
  },
  {
    "id": "nutrition_608",
    "title": "板栗肉末饭",
    "name": "板栗肉末饭",
    "description": "板栗和肉末米饭同煮，秋季温补。",
    "category": "午餐",
    "tags": [
      "秋季",
      "板栗",
      "肉末",
      "温补",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "14分钟",
    "calories": "520卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "板栗",
        "amount": "24g"
      },
      {
        "name": "山药",
        "amount": "32g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "板栗洗净处理",
      "山药准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "板栗补充秋季营养，山药增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 156
  },
  {
    "id": "nutrition_609",
    "title": "萝卜羊肉汤",
    "name": "萝卜羊肉汤",
    "description": "秋冬萝卜炖羊肉，温补暖胃。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "萝卜",
      "羊肉",
      "温补",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "29分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "21g"
      },
      {
        "name": "白菜",
        "amount": "35g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 223
  },
  {
    "id": "nutrition_610",
    "title": "山药蒸蛋",
    "name": "山药蒸蛋",
    "description": "秋冬山药温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "山药",
      "鸡蛋",
      "温和",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "15分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "47g"
      },
      {
        "name": "白菜",
        "amount": "36g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 110
  },
  {
    "id": "nutrition_611",
    "title": "红薯鸡肉粥",
    "name": "红薯鸡肉粥",
    "description": "秋冬红薯甜糯，和鸡肉煮粥。",
    "category": "早餐",
    "tags": [
      "秋冬",
      "红薯",
      "鸡肉",
      "暖胃",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "36分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "33g"
      },
      {
        "name": "白菜",
        "amount": "49g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 57
  },
  {
    "id": "nutrition_612",
    "title": "白菜肉末饭",
    "name": "白菜肉末饭",
    "description": "秋冬白菜清甜，和肉末米饭同煮。",
    "category": "午餐",
    "tags": [
      "秋冬",
      "白菜",
      "肉末",
      "主食",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "26分钟",
    "calories": "572卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "49g"
      },
      {
        "name": "白菜",
        "amount": "28g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 55
  },
  {
    "id": "nutrition_613",
    "title": "土豆豆腐汤",
    "name": "土豆豆腐汤",
    "description": "秋冬土豆软糯，和豆腐煮汤。",
    "category": "汤品",
    "tags": [
      "秋冬",
      "土豆",
      "豆腐",
      "温和",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "31分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "萝卜",
        "amount": "47g"
      },
      {
        "name": "白菜",
        "amount": "42g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "萝卜洗净处理",
      "白菜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "萝卜补充秋冬营养，白菜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 160
  },
  {
    "id": "nutrition_614",
    "title": "豆米南瓜软烩饭",
    "name": "豆米南瓜软烩饭",
    "description": "贵州豆米火锅的温和灵感版。",
    "category": "晚餐",
    "tags": [
      "冬季",
      "豆米",
      "南瓜",
      "暖胃",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "26分钟",
    "calories": "572卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "31g"
      },
      {
        "name": "萝卜",
        "amount": "21g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 93
  },
  {
    "id": "nutrition_615",
    "title": "白菜猪肉饺子",
    "name": "白菜猪肉饺子",
    "description": "冬季白菜猪肉饺子，温暖暖胃。",
    "category": "午餐",
    "tags": [
      "冬季",
      "白菜",
      "猪肉",
      "主食",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "14分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "40g"
      },
      {
        "name": "萝卜",
        "amount": "31g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 86
  },
  {
    "id": "nutrition_616",
    "title": "萝卜牛肉汤",
    "name": "萝卜牛肉汤",
    "description": "冬季萝卜炖牛肉，温补强身。",
    "category": "汤品",
    "tags": [
      "冬季",
      "萝卜",
      "牛肉",
      "温补",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "17分钟",
    "calories": "572卡",
    "difficulty": "中等",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "39g"
      },
      {
        "name": "萝卜",
        "amount": "43g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 134
  },
  {
    "id": "nutrition_617",
    "title": "山药小米粥",
    "name": "山药小米粥",
    "description": "冬季山药温和，和小米煮粥。",
    "category": "早餐",
    "tags": [
      "冬季",
      "山药",
      "小米",
      "暖胃",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "34分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "29g"
      },
      {
        "name": "萝卜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 209
  },
  {
    "id": "nutrition_618",
    "title": "豆腐蒸蛋",
    "name": "豆腐蒸蛋",
    "description": "冬季豆腐温和，和鸡蛋蒸制。",
    "category": "早餐",
    "tags": [
      "冬季",
      "豆腐",
      "鸡蛋",
      "蛋白质",
      "12岁以上"
    ],
    "ageRange": "12岁以上",
    "cookTime": "30分钟",
    "calories": "572卡",
    "difficulty": "简单",
    "ingredients": [
      {
        "name": "白菜",
        "amount": "25g"
      },
      {
        "name": "萝卜",
        "amount": "38g"
      },
      {
        "name": "清水",
        "amount": "适量"
      }
    ],
    "steps": [
      "白菜洗净处理",
      "萝卜准备",
      "加水煮开",
      "小火煮至软烂"
    ],
    "nutrition": {
      "highlight": "白菜补充冬季营养，萝卜增添风味",
      "protein": "25g",
      "carbs": "70g",
      "fat": "15g",
      "fiber": "7g"
    },
    "tips": "12岁以上青少年注意健康饮食，控制油盐摄入。",
    "viewCount": 122
  }
];;

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
