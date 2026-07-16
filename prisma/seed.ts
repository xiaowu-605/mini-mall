import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/** 调色板：15 组主色 + 辅色，用于生成多样化的产品图 */
const PALETTE: [string, string][] = [
  ['#5B8DEF', '#7EB6FF'],
  ['#F5A623', '#FFBE5C'],
  ['#4A90D9', '#6DB3F2'],
  ['#E8635A', '#FF8A82'],
  ['#7B68EE', '#A79AFF'],
  ['#FF6B6B', '#FF9E9E'],
  ['#4ECDC4', '#7EDDD6'],
  ['#45B7D1', '#7ECFE0'],
  ['#F7DC6F', '#FFF3A0'],
  ['#3FB984', '#76D4A8'],
  ['#E8964A', '#F5B87D'],
  ['#FFB347', '#FFCE80'],
  ['#6C5CE7', '#A79AFF'],
  ['#FD79A8', '#FEA8C9'],
  ['#00B894', '#55EFC4'],
]

/** SVG 模板列表 */
const SVG_TYPES = [
  'keyboard', 'headphone', 'monitor', 'speaker', 'mouse',
  'sneaker', 'tshirt', 'jacket', 'jeans',
  'book', 'lamp', 'cup', 'cushion',
]

/** 生成卡通产品 SVG（400×400 扁平风格） */
function productSvg(type: string, primaryColor: string, accentColor: string): string {
  const svgMap: Record<string, string> = {
    keyboard: `<rect x="60" y="120" rx="12" width="280" height="160" fill="${primaryColor}"/>
      <rect x="76" y="136" rx="4" width="248" height="128" fill="${accentColor}" opacity="0.3"/>
      <g fill="${primaryColor}" opacity="0.6">${Array.from({ length: 3 }, (_, r) => Array.from({ length: 6 }, (_, c) => `<rect x="${80 + c * 42}" y="${152 + r * 38}" rx="3" width="32" height="28"/>`).join('')).join('')}</g>
      <circle cx="340" cy="260" r="12" fill="${primaryColor}" opacity="0.4"/>
      <circle cx="340" cy="290" r="12" fill="${primaryColor}" opacity="0.4"/>`,
    headphone: `<ellipse cx="120" cy="200" rx="70" ry="80" fill="${primaryColor}"/>
      <ellipse cx="280" cy="200" rx="70" ry="80" fill="${primaryColor}"/>
      <ellipse cx="120" cy="200" rx="40" ry="50" fill="${accentColor}" opacity="0.4"/>
      <ellipse cx="280" cy="200" rx="40" ry="50" fill="${accentColor}" opacity="0.4"/>
      <path d="M190 180 Q200 100 200 80 Q200 60 190 60 L210 60 Q200 60 200 80 Q200 100 210 180" fill="none" stroke="${primaryColor}" stroke-width="12" stroke-linecap="round"/>`,
    monitor: `<rect x="70" y="60" rx="16" width="260" height="180" fill="${primaryColor}"/>
      <rect x="88" y="78" rx="8" width="224" height="144" fill="${accentColor}" opacity="0.25"/>
      <rect x="110" y="100" rx="6" width="120" height="14" fill="${accentColor}" opacity="0.5"/>
      <rect x="110" y="128" rx="6" width="180" height="10" fill="${accentColor}" opacity="0.3"/>
      <rect x="110" y="150" rx="6" width="150" height="10" fill="${accentColor}" opacity="0.3"/>
      <rect x="110" y="172" rx="6" width="100" height="10" fill="${accentColor}" opacity="0.3"/>
      <rect x="160" y="250" rx="6" width="80" height="14" fill="${primaryColor}"/>
      <rect x="145" y="270" rx="8" width="110" height="12" fill="${primaryColor}"/>`,
    speaker: `<rect x="100" y="80" rx="20" width="200" height="260" fill="${primaryColor}"/>
      <rect x="118" y="100" rx="12" width="164" height="120" fill="${accentColor}" opacity="0.3"/>
      <circle cx="200" cy="160" r="40" fill="${accentColor}" opacity="0.5"/>
      <circle cx="200" cy="160" r="18" fill="${primaryColor}"/>
      <circle cx="160" cy="245" r="8" fill="${accentColor}" opacity="0.4"/>
      <circle cx="200" cy="245" r="8" fill="${accentColor}" opacity="0.4"/>
      <circle cx="240" cy="245" r="8" fill="${accentColor}" opacity="0.4"/>`,
    mouse: `<rect x="120" y="60" rx="50" width="160" height="220" fill="${primaryColor}"/>
      <rect x="120" y="260" rx="0" width="160" height="80" fill="none"/>
      <line x1="200" y1="110" x2="200" y2="170" stroke="${accentColor}" stroke-width="4" opacity="0.4"/>
      <circle cx="200" cy="190" r="14" fill="${accentColor}" opacity="0.25"/>
      <circle cx="200" cy="190" r="6" fill="${accentColor}" opacity="0.35"/>`,
    sneaker: `<path d="M60 250 Q80 220 140 210 L240 200 L300 180 Q320 175 330 190 L340 220 Q340 240 320 250 L240 260 L100 265 L60 260 Z" fill="${primaryColor}"/>
      <path d="M80 255 L120 250 L240 245 L320 250" fill="none" stroke="${accentColor}" stroke-width="3" opacity="0.4"/>
      <rect x="280" y="170" rx="4" width="50" height="16" fill="${accentColor}" opacity="0.3" transform="rotate(-15 305 178)"/>
      <circle cx="240" cy="225" r="14" fill="${accentColor}" opacity="0.3"/><circle cx="240" cy="225" r="6" fill="#fff" opacity="0.6"/>`,
    tshirt: `<path d="M120 80 L160 120 L120 140 L80 340 L320 340 L280 140 L240 120 L280 80 Q200 60 120 80Z" fill="${primaryColor}"/>
      <circle cx="200" cy="100" r="30" fill="${accentColor}" opacity="0.3"/>
      <path d="M200 130 L200 340" stroke="${accentColor}" stroke-width="2" opacity="0.2"/>
      <rect x="140" y="250" rx="4" width="50" height="30" fill="${accentColor}" opacity="0.25"/>
      <rect x="210" y="250" rx="4" width="50" height="30" fill="${accentColor}" opacity="0.25"/>`,
    jacket: `<path d="M80 100 L120 140 L100 180 L70 340 L180 340 L200 260 L220 340 L330 340 L300 180 L280 140 L320 100 Q200 80 80 100Z" fill="${primaryColor}"/>
      <line x1="200" y1="120" x2="200" y2="260" stroke="${accentColor}" stroke-width="3" opacity="0.3"/>
      <rect x="110" y="200" rx="4" width="40" height="30" fill="${accentColor}" opacity="0.25"/>
      <rect x="250" y="200" rx="4" width="40" height="30" fill="${accentColor}" opacity="0.25"/>
      <circle cx="200" cy="130" r="8" fill="${accentColor}" opacity="0.4"/>`,
    jeans: `<path d="M120 80 L160 80 L170 200 L190 200 L190 80 L210 80 L210 200 L230 200 L240 80 L280 80 L290 200 L260 340 L230 340 L210 300 L190 340 L160 340 L140 300 L110 340 L20 340 Q80 180 120 80Z" fill="${primaryColor}"/>
      <rect x="140" y="240" rx="3" width="30" height="24" fill="${accentColor}" opacity="0.25"/>
      <rect x="230" y="240" rx="3" width="30" height="24" fill="${accentColor}" opacity="0.25"/>
      <circle cx="200" cy="130" r="10" fill="${accentColor}" opacity="0.3"/>`,
    book: `<rect x="80" y="70" rx="6" width="180" height="260" fill="${primaryColor}"/>
      <rect x="80" y="70" rx="6" width="180" height="56" fill="${accentColor}"/>
      <rect x="100" y="88" rx="3" width="90" height="10" fill="#fff" opacity="0.7"/>
      <rect x="100" y="106" rx="3" width="140" height="8" fill="#fff" opacity="0.4"/>
      <rect x="100" y="150" rx="3" width="140" height="6" fill="${accentColor}" opacity="0.2"/>
      <rect x="100" y="168" rx="3" width="120" height="6" fill="${accentColor}" opacity="0.2"/>
      <rect x="100" y="186" rx="3" width="130" height="6" fill="${accentColor}" opacity="0.2"/>
      <rect x="100" y="204" rx="3" width="100" height="6" fill="${accentColor}" opacity="0.2"/>
      <rect x="100" y="240" rx="3" width="110" height="6" fill="${accentColor}" opacity="0.2"/>
      <rect x="100" y="258" rx="3" width="90" height="6" fill="${accentColor}" opacity="0.2"/>
      <rect x="260" y="70" rx="0" width="20" height="260" fill="${primaryColor}" opacity="0.7"/>
      <line x1="100" y1="230" x2="100" y2="290" stroke="${accentColor}" stroke-width="2" opacity="0.15"/>`,
    lamp: `<rect x="145" y="180" rx="6" width="110" height="170" fill="${primaryColor}"/>
      <rect x="120" y="340" rx="10" width="160" height="14" fill="${primaryColor}"/>
      <path d="M120 180 Q200 60 280 180" fill="${accentColor}" opacity="0.3"/>
      <path d="M130 180 Q200 80 270 180" fill="${accentColor}" opacity="0.15"/>
      <rect x="135" y="175" rx="6" width="130" height="12" fill="${primaryColor}"/>
      <line x1="200" y1="100" x2="200" y2="140" stroke="${primaryColor}" stroke-width="4" opacity="0.5"/>`,
    cup: `<rect x="100" y="100" rx="14" width="200" height="220" fill="${primaryColor}"/>
      <path d="M300 140 Q340 140 340 200 Q340 260 300 260" fill="none" stroke="${primaryColor}" stroke-width="20" stroke-linecap="round"/>
      <rect x="110" y="115" rx="8" width="180" height="190" fill="${accentColor}" opacity="0.2"/>
      <ellipse cx="200" cy="120" rx="85" ry="16" fill="${accentColor}" opacity="0.3"/>
      <path d="M160 180 Q180 150 200 180 Q220 210 240 180" fill="none" stroke="#fff" stroke-width="3" opacity="0.4" stroke-linecap="round"/>
      <circle cx="170" cy="160" r="5" fill="#fff" opacity="0.3"/>
      <circle cx="220" cy="155" r="4" fill="#fff" opacity="0.3"/>`,
    cushion: `<rect x="70" y="100" rx="40" width="260" height="200" fill="${primaryColor}"/>
      <rect x="85" y="115" rx="30" width="230" height="170" fill="${accentColor}" opacity="0.25"/>
      <line x1="200" y1="115" x2="200" y2="285" stroke="${accentColor}" stroke-width="2" opacity="0.2"/>
      <line x1="85" y1="200" x2="315" y2="200" stroke="${accentColor}" stroke-width="2" opacity="0.2"/>
      <circle cx="140" cy="160" r="8" fill="${accentColor}" opacity="0.2"/>
      <circle cx="200" cy="140" r="8" fill="${accentColor}" opacity="0.2"/>
      <circle cx="260" cy="160" r="8" fill="${accentColor}" opacity="0.2"/>
      <circle cx="140" cy="240" r="8" fill="${accentColor}" opacity="0.2"/>
      <circle cx="260" cy="240" r="8" fill="${accentColor}" opacity="0.2"/>`,
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" rx="20" fill="#F5F7FA"/>
    <circle cx="200" cy="200" r="170" fill="${accentColor}" opacity="0.08"/>
    ${svgMap[type] || svgMap.book}
  </svg>`
}

/** SVG → data URI */
function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`
}

/** 产品名称词库 */
const ADJECTIVES = ['高端', '便携', '无线', '智能', '经典', '时尚', '简约', '旗舰', '超薄', '静音',
  '多功能', '专业', '迷你', '大容量', '快充', '防滑', '环保', '复古', '北欧', '人体工学']
const DIGITAL_NOUNS = ['机械键盘', '蓝牙耳机', '显示器', '音箱', '鼠标', '充电器', '数据线', 'U盘', '摄像头', '路由器',
  '移动电源', '平板支架', '读卡器', '拓展坞', '麦克风', '手写板', '智能手表', '运动相机', '无人机', '投影仪']
const CLOTHING_NOUNS = ['T恤', '衬衫', '卫衣', '夹克', '休闲裤', '运动鞋', '羽绒服', '连衣裙', '短裤', '风衣',
  '针织衫', '牛仔裤', '棉服', '马甲', '西装', '棒球帽', '围巾', '手套', '袜子', '背包']
const BOOK_NOUNS = ['JavaScript高级编程', '深入理解计算机系统', '算法导论', '设计模式精解', 'Python机器学习',
  '数据结构实战', '操作系统原理', '网络协议详解', '数据库系统', '编译器设计',
  '人工智能导论', '前端工程化', '微服务架构', '云原生应用', '区块链技术',
  'Rust编程指南', 'Go语言实战', 'Kubernetes实践', 'Linux内核分析', '分布式系统设计']
const HOME_NOUNS = ['台灯', '保温杯', '坐垫', '收纳盒', '香薰机', '加湿器', '电风扇', '吹风机', '毛巾套装', '拖鞋',
  '挂钟', '花瓶', '地毯', '抱枕', '餐具套装', '水壶', '置物架', '窗帘', '瑜伽垫', '体重秤']

/** 按分类生成产品名称 */
function productName(cat: string, i: number): string {
  const adj = ADJECTIVES[i % ADJECTIVES.length]
  let nouns: string[]
  switch (cat) {
    case '数码产品': nouns = DIGITAL_NOUNS; break
    case '服装鞋帽': nouns = CLOTHING_NOUNS; break
    case '图书音像': nouns = BOOK_NOUNS; break
    default: nouns = HOME_NOUNS
  }
  return `${adj}${nouns[i % nouns.length]}`
}

/** 生成描述 */
function productDesc(cat: string, i: number): string {
  const prefix = cat === '图书音像' ? '经典畅销书籍，内容翔实，案例丰富，' : '品质优良，设计精美，'
  return `${prefix}编号#${i + 1}，${cat}类热门商品，值得信赖。`
}

async function main() {
  console.log('开始填充种子数据…')

  // 演示账号列表（密码明文仅用于开发环境一键填入）
  const DEMO_USERS = [
    { email: 'admin@mini-mall.com', password: 'admin123', name: '超级管理员', role: 'admin', permissions: JSON.stringify(['super_admin']), memberLevel: 3, totalSpent: 5000 },
    { email: 'admin2@mini-mall.com', password: 'admin123', name: '普通管理员', role: 'admin', permissions: JSON.stringify([]), memberLevel: 0, totalSpent: 0 },
    { email: 'user@mini-mall.com', password: 'user123', name: '普通用户', role: 'user', permissions: JSON.stringify([]), memberLevel: 1, totalSpent: 1500 },
    { email: 'vip@mini-mall.com', password: 'vip123', name: 'VIP会员', role: 'user', permissions: JSON.stringify([]), memberLevel: 3, totalSpent: 8000 },
  ]

  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: await bcrypt.hash(u.password, 10),
        name: u.name,
        role: u.role,
        permissions: u.permissions,
        memberLevel: u.memberLevel,
        totalSpent: u.totalSpent,
      },
      create: {
        email: u.email,
        password: await bcrypt.hash(u.password, 10),
        name: u.name,
        role: u.role,
        permissions: u.permissions,
        memberLevel: u.memberLevel,
        totalSpent: u.totalSpent,
      },
    })
    console.log(`演示账号: ${user.email} / ${u.password} (${u.role})`)
  }

  // 创建分类
  const categoryNames = ['数码产品', '服装鞋帽', '图书音像', '家居生活']
  const categoryMap: Record<string, number> = {}
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    categoryMap[name] = cat.id
  }
  console.log(`创建了 ${categoryNames.length} 个分类`)

  // 清理旧商品数据（按依赖顺序）
  await prisma.orderItem.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.product.deleteMany()

  // 生成 1000 条商品（每个分类 250 条）
  const TOTAL = 1000
  const PER_CAT = TOTAL / categoryNames.length
  const products: any[] = []

  for (const catName of categoryNames) {
    for (let i = 0; i < PER_CAT; i++) {
      const idx = products.length
      const [pColor, aColor] = PALETTE[idx % PALETTE.length]
      const svgType = SVG_TYPES[idx % SVG_TYPES.length]
      const name = productName(catName, i)

      products.push({
        name,
        description: productDesc(catName, i),
        price: Math.round((19.9 + Math.random() * 980.1) * 100) / 100,
        stock: Math.floor(Math.random() * 500) + 1,
        categoryId: categoryMap[catName],
        image: svgDataUri(productSvg(svgType, pColor, aColor)),
      })
    }
  }

  // 批量插入（SQLite 单次插入过大可能超限，分批 100 条）
  const BATCH = 100
  for (let i = 0; i < products.length; i += BATCH) {
    const chunk = products.slice(i, i + BATCH)
    await prisma.product.createMany({ data: chunk })
  }

  console.log(`创建了 ${products.length} 个商品`)
  console.log('种子数据填充完成！')
}

main()
  .catch((e) => {
    console.error('种子数据填充失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
