import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
    await prisma.product.create({
      data: {
        ...p,
        image: `https://picsum.photos/seed/${encodeURIComponent(p.name)}/400/400`,
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
