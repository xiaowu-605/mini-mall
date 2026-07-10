import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/** 生成卡通产品 SVG（400×400 扁平风格） */
function productSvg(type: string, primaryColor: string, accentColor: string): string {
  const svgMap: Record<string, string> = {
    keyboard: `<rect x="60" y="120" rx="12" width="280" height="160" fill="${primaryColor}"/>
      <rect x="76" y="136" rx="4" width="248" height="128" fill="${accentColor}" opacity="0.3"/>
      <g fill="${primaryColor}" opacity="0.6">${Array.from({length:3},(_,r)=>Array.from({length:6},(_,c)=>`<rect x="${80+c*42}" y="${152+r*38}" rx="3" width="32" height="28"/>`).join('')).join('')}</g>
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

// 产品图片配置：[svgType, primaryColor, accentColor]
const productImages: Record<string, [string, string, string]> = {
  '机械键盘 87键 RGB背光': ['keyboard', '#5B8DEF', '#7EB6FF'],
  '蓝牙降噪耳机': ['headphone', '#F5A623', '#FFBE5C'],
  '27英寸 4K 显示器': ['monitor', '#4A90D9', '#6DB3F2'],
  '便携式蓝牙音箱': ['speaker', '#E8635A', '#FF8A82'],
  '无线充电鼠标': ['mouse', '#7B68EE', '#A79AFF'],
  '休闲运动鞋 男女同款': ['sneaker', '#FF6B6B', '#FF9E9E'],
  '纯棉短袖T恤': ['tshirt', '#4ECDC4', '#7EDDD6'],
  '轻薄羽绒服': ['jacket', '#45B7D1', '#7ECFE0'],
  '牛仔裤男 弹力修身': ['jeans', '#5B8DEF', '#8DB3F5'],
  'JavaScript高级程序设计（第4版）': ['book', '#F7DC6F', '#FFF3A0'],
  '深入浅出Vue.js': ['book', '#3FB984', '#76D4A8'],
  '设计模式：可复用面向对象软件的基础': ['book', '#E8964A', '#F5B87D'],
  '北欧风台灯 护眼LED': ['lamp', '#FFB347', '#FFCE80'],
  '真空保温杯 500ml': ['cup', '#6C5CE7', '#A79AFF'],
  '记忆棉坐垫 办公室靠垫': ['cushion', '#FD79A8', '#FEA8C9'],
}

async function main() {
  console.log('开始填充种子数据...')

  // 创建管理员
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mini-mall.com' },
    update: {},
    create: {
      email: 'admin@mini-mall.com',
      password: await bcrypt.hash('admin123', 10),
      name: '管理员',
      role: 'admin',
      permissions: JSON.stringify(['super_admin']),
    },
  })
  console.log(`管理员账号: ${admin.email} / admin123`)

  // 创建分类（upsert 避免重复执行报错）
  const categoryNames = ['数码产品', '服装鞋帽', '图书音像', '家居生活']
  const categories = []
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    categories.push(cat)
  }

  console.log(`创建了 ${categories.length} 个分类`)

  // 商品数据
  const products = [
    // 数码产品
    { name: '机械键盘 87键 RGB背光', description: 'Cherry MX 青轴，全键无冲，铝合金面板，87键紧凑布局。', price: 299, stock: 50, categoryId: categories[0].id },
    { name: '蓝牙降噪耳机', description: '主动降噪，40小时续航，蓝牙5.3，支持LDAC高清音频。', price: 599, stock: 30, categoryId: categories[0].id },
    { name: '27英寸 4K 显示器', description: 'IPS面板，100% sRGB，Type-C 65W充电，旋转升降支架。', price: 1899, stock: 15, categoryId: categories[0].id },
    { name: '便携式蓝牙音箱', description: 'IPX7防水，20小时续航，30W大功率，支持TWS串联。', price: 199, stock: 80, categoryId: categories[0].id },
    { name: '无线充电鼠标', description: '人体工学设计，静音按键，4000CPI，Type-C快充。', price: 89, stock: 120, categoryId: categories[0].id },

    // 服装鞋帽
    { name: '休闲运动鞋 男女同款', description: '飞织鞋面，轻盈透气，EVA缓震中底，橡胶防滑大底。', price: 259, stock: 200, categoryId: categories[1].id },
    { name: '纯棉短袖T恤', description: '100%新疆长绒棉，重磅220g，宽松版型，不易变形。', price: 69, stock: 500, categoryId: categories[1].id },
    { name: '轻薄羽绒服', description: '90%白鹅绒，蓬松度700+，可收纳设计，防泼水面料。', price: 459, stock: 60, categoryId: categories[1].id },
    { name: '牛仔裤男 弹力修身', description: '新疆棉混纺，微弹力面料，经典五袋款，四季可穿。', price: 159, stock: 180, categoryId: categories[1].id },

    // 图书音像
    { name: 'JavaScript高级程序设计（第4版）', description: '前端开发红宝书，全面覆盖ES6+语法、DOM、BOM、事件、Ajax等核心知识。', price: 99, stock: 300, categoryId: categories[2].id },
    { name: '深入浅出Vue.js', description: '从响应式原理到虚拟DOM，全面解析Vue.js内部实现机制。', price: 79, stock: 250, categoryId: categories[2].id },
    { name: '设计模式：可复用面向对象软件的基础', description: 'GoF经典之作，23种设计模式详细讲解，软件工程师必读。', price: 69, stock: 150, categoryId: categories[2].id },

    // 家居生活
    { name: '北欧风台灯 护眼LED', description: '三档色温调节，无频闪，无极调光，可折叠设计。', price: 129, stock: 100, categoryId: categories[3].id },
    { name: '真空保温杯 500ml', description: '316不锈钢内胆，12小时保温，食品级硅胶密封圈。', price: 89, stock: 400, categoryId: categories[3].id },
    { name: '记忆棉坐垫 办公室靠垫', description: '慢回弹记忆棉，减压护腰，可拆洗外套，防滑底。', price: 119, stock: 150, categoryId: categories[3].id },
  ]

  // 清理旧数据（按依赖顺序）
  await prisma.orderItem.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.product.deleteMany()

  for (const p of products) {
    const [svgType, primaryColor, accentColor] = productImages[p.name] || ['book', '#ccc', '#eee']
    await prisma.product.create({
      data: {
        ...p,
        image: svgDataUri(productSvg(svgType, primaryColor, accentColor)),
      },
    })
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
