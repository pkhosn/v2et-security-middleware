import type Koa from 'koa'
import KoaRouter from '@koa/router'
import chalk from 'chalk'
import { BackendService } from './services/backend.js'
import { backendDomain, distributorAccessPassword } from './env.js'

export const router = new KoaRouter()

// 会话存储（简单内存存储，生产环境建议用 Redis）
const validSessions = new Set<string>()

// 类型扩展
interface KoaRequestBody {
  email?: string
  code?: string
  plan_id?: number
  period?: string
  coupon_code?: string
  [key: string]: any
}

/**
 * GET /api/v1/distributor/status
 * 检查中间件服务状态
 */
router.get('/api/v1/distributor/status', async (ctx: Koa.Context) => {
  const backend = BackendService.instance
  ctx.response.body = {
    status: 'ok',
    tokenValid: backend.isTokenValid(),
    passwordProtected: !!distributorAccessPassword,
    timestamp: Date.now(),
  }
})

/**
 * POST /api/v1/distributor/auth
 * 验证访问密码
 */
router.post('/api/v1/distributor/auth', async (ctx: Koa.Context) => {
  const { password } = (ctx.request as any).body as { password: string }

  // 如果未设置密码，直接返回成功
  if (!distributorAccessPassword) {
    ctx.response.body = {
      success: true,
      message: '无需验证',
    }
    return
  }

  // 验证密码：必须完全匹配且密码不能为空
  if (password && password === distributorAccessPassword) {
    // 生成会话 token（简单实现，生产环境建议用 JWT）
    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
    validSessions.add(sessionToken)
    
    ctx.response.body = {
      success: true,
      message: '验证通过',
      token: sessionToken,
    }
  } else {
    ctx.response.status = 401
    ctx.response.body = {
      success: false,
      message: '访问密码错误',
    }
  }
})

/**
 * 验证访问权限的中间件
 */
function requireAuth() {
  return (ctx: Koa.Context, next: () => Promise<void>) => {
    // 如果未设置密码，跳过验证
    if (!distributorAccessPassword) {
      return next()
    }

    const token = ctx.headers['x-access-token'] as string
    
    if (!token || !validSessions.has(token)) {
      ctx.response.status = 401
      ctx.response.body = {
        success: false,
        message: '未授权访问',
      }
      return
    }

    return next()
  }
}

/**
 * POST /api/v1/distributor/user/query
 * 通过邮箱查询用户信息
 */
router.post('/api/v1/distributor/user/query', requireAuth(), async (ctx: Koa.Context) => {
  const { email } = (ctx.request as any).body as { email: string }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ctx.response.status = 400
    ctx.response.body = {
      success: false,
      message: '邮箱格式不正确',
    }
    return
  }

  try {
    const backend = BackendService.instance
    
    // 查询用户
    const user = await backend.getUserByEmail(email)
    
    if (!user) {
      // 用户不存在，返回错误，不允许继续
      ctx.response.status = 404
      ctx.response.body = {
        success: false,
        message: '未查询到邮箱数据',
      }
      return
    }

    // 用户已存在，返回完整信息
    ctx.response.body = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        plan_id: user.plan_id,
        transfer_enable: user.transfer_enable,
        used: (user.u || 0) + (user.d || 0),
        expired_at: user.expired_at,
        balance: user.balance,
      },
      exists: true,
    }
  } catch (e) {
    console.error(chalk.red('查询用户失败:'), e)
    ctx.response.status = 500
    ctx.response.body = {
      success: false,
      message: '查询失败',
    }
  }
})

/**
 * POST /api/v1/distributor/plan/fetch
 * 获取套餐列表
 */
router.post('/api/v1/distributor/plan/fetch', requireAuth(), async (ctx: Koa.Context) => {
  try {
    const backend = BackendService.instance
    const plans = await backend.getPlanList()
    
    ctx.response.body = {
      success: true,
      data: plans,
    }
  } catch (e) {
    console.error(chalk.red('获取套餐列表失败:'), e)
    ctx.response.status = 500
    ctx.response.body = {
      success: false,
      message: '获取套餐列表失败',
    }
  }
})

/**
 * POST /api/v1/distributor/coupon/check
 * 验证优惠券
 */
router.post('/api/v1/distributor/coupon/check', requireAuth(), async (ctx: Koa.Context) => {
  const { code, plan_id, period } = (ctx.request as any).body as {
    code: string
    plan_id: number
    period: string
  }

  if (!code) {
    ctx.response.status = 400
    ctx.response.body = {
      success: false,
      message: '兑换码不能为空',
    }
    return
  }

  try {
    const backend = BackendService.instance
    const coupon = await backend.verifyCoupon(code, plan_id, period as any)

    if (!coupon) {
      ctx.response.body = {
        success: false,
        message: '兑换码无效',
      }
      return
    }

    ctx.response.body = {
      success: true,
      data: coupon,
    }
  } catch (e) {
    console.error(chalk.red('验证优惠券失败:'), e)
    ctx.response.status = 500
    ctx.response.body = {
      success: false,
      message: '验证失败',
    }
  }
})

/**
 * POST /api/v1/distributor/exchange
 * 执行兑换（分销商核心接口）
 */
router.post('/api/v1/distributor/exchange', requireAuth(), async (ctx: Koa.Context) => {
  const { email, plan_id, period, coupon_code } = (ctx.request as any).body as {
    email: string
    plan_id: number
    period: string
    coupon_code: string
  }

  // 参数验证
  if (!email || !plan_id || !period || !coupon_code) {
    ctx.response.status = 400
    ctx.response.body = {
      success: false,
      message: '参数不完整',
    }
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ctx.response.status = 400
    ctx.response.body = {
      success: false,
      message: '邮箱格式不正确',
    }
    return
  }

  try {
    const backend = BackendService.instance
    
    console.log(chalk.blue('开始兑换流程:'), {
      email,
      plan_id,
      period,
      coupon_code,
    })

    // 执行兑换
    const result = await backend.exchangeForDistributor(
      email,
      plan_id,
      period as any,
      coupon_code
    )

    if (result.success) {
      ctx.response.body = {
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          tradeNo: result.tradeNo,
        },
      }
    } else {
      ctx.response.status = 400
      ctx.response.body = {
        success: false,
        message: result.message,
      }
    }
  } catch (e) {
    console.error(chalk.red('兑换失败:'), e)
    ctx.response.status = 500
    ctx.response.body = {
      success: false,
      message: e instanceof Error ? e.message : '兑换失败',
    }
  }
})

/**
 * 代理转发（可选功能）
 * 将所有其他请求转发到 V2Board 后端
 */
router.all('/api/v1/:segments*', async (ctx: Koa.Context) => {
  const { segments } = ctx.params
  const path = `/api/v1/${Array.isArray(segments) ? segments.join('/') : segments}`
  const url = `${backendDomain}${path}`

  const authHeader = ctx.headers['authorization'] as string
  console.log(chalk.gray('[代理转发]'), {
    method: ctx.method,
    path,
    hasAuthHeader: !!authHeader,
    authHeaderPrefix: authHeader ? authHeader.slice(0, 20) + '...' : 'none',
    requestBody: JSON.stringify((ctx.request as any).body).slice(0, 200)
  })

  try {
    const backend = BackendService.instance
    // 重要：传递前端传来的 Authorization header，确保用户身份正确
    const response = await backend.request(url, {
      method: ctx.method,
      body: JSON.stringify((ctx.request as any).body),
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    })

    ctx.response.body = response
  } catch (e) {
    console.error(chalk.red('代理转发失败:'), e)
    ctx.response.status = 500
    ctx.response.body = {
      message: '代理转发失败',
    }
  }
})
