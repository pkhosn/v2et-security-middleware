import chalk from 'chalk'
import { backendDomain, adminApiPrefix, adminEmail, adminPassword } from '../env.js'

interface Plan {
  id: number
  name: string
  show: 1 | 0
  month_price: number | null
  quarter_price: number | null
  half_year_price: number | null
  year_price: number | null
  two_year_price: number | null
  three_year_price: number | null
  onetime_price: number | null
  reset_price: number | null
}

interface User {
  id: number
  email: string
  plan_id: number | null
  group_id: number | null
  transfer_enable: number
  u: number
  d: number
  expired_at: number | null
  balance: number
  commission_balance: number
  plan?: any
}

export type PlanPeriodKey = 
  | 'month_price' 
  | 'quarter_price' 
  | 'half_year_price' 
  | 'year_price' 
  | 'two_year_price' 
  | 'three_year_price' 
  | 'onetime_price' 
  | 'reset_price'

export class BackendService {
  static _instance: BackendService

  static get instance() {
    if (!this._instance) {
      this._instance = new BackendService()
    }
    return this._instance
  }

  adminToken: string | null = null
  tokenExpireAt: number = 0

  private constructor() {
    this.initAdminToken()
  }

  adminApi(path: string): string {
    return `${backendDomain}/api/v1/${adminApiPrefix}/${path}`
  }

  userApi(path: string): string {
    return `${backendDomain}/api/v1/user/${path}`
  }

  passportApi(path: string): string {
    return `${backendDomain}/api/v1/passport/${path}`
  }

  async request<T>(url: string, init: RequestInit): Promise<T> {
    // 检查调用方是否已传入 Authorization header（用户 token）
    const hasUserAuth = init.headers && (init.headers as Record<string, string>)['Authorization']
    const usingAdminToken = this.adminToken && !hasUserAuth
    
    console.log(chalk.blue('[Backend.request]'), {
      url: url.replace(backendDomain, ''),
      hasUserAuth: !!hasUserAuth,
      usingAdminToken,
      adminTokenPrefix: this.adminToken ? this.adminToken.slice(0, 20) + '...' : 'none'
    })
    
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        // 只有当调用方没有传入用户 token 时，才使用 adminToken
        ...(this.adminToken && !hasUserAuth && { 'Authorization': this.adminToken }),
        ...init.headers,
      },
    })

    const text = await response.text()
    
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(`请求失败：${response.status} ${text}`)
    }
  }

  async initAdminToken() {
    if (!adminApiPrefix || !adminEmail || !adminPassword) {
      console.warn(chalk.bgYellow('WARNING:'), '管理员配置缺失，免登功能不可用')
      return
    }

    try {
      const url = this.passportApi('auth/login')
      const result = await this.request<{ data: { auth_data: string } }>(url, {
        method: 'POST',
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      })

      this.adminToken = result.data?.auth_data || null
      
      if (this.adminToken) {
        this.tokenExpireAt = Date.now() + 24 * 60 * 60 * 1000
        console.log(chalk.bgGreen('SUCCESS:'), '管理员 Token 初始化完成')
        setTimeout(() => this.initAdminToken(), 23 * 60 * 60 * 1000)
      } else {
        console.error(chalk.bgRed('ERROR:'), '管理员登录失败，未获取到 token')
      }
    } catch (e) {
      console.error(chalk.bgRed('ERROR:'), '管理员 Token 初始化失败:', e)
    }
  }

  isTokenValid(): boolean {
    return !!this.adminToken && Date.now() < this.tokenExpireAt
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const url = this.adminApi('user/fetch')
    const params = new URLSearchParams({
      'filter[0][key]': 'email',
      'filter[0][condition]': '模糊',
      'filter[0][value]': email,
    })
    
    try {
      const result = await this.request<{ data: User[] }>(`${url}?${params.toString()}`, {
        method: 'GET',
      })
      
      if (result.data && result.data[0]) {
        const user = result.data[0]
        console.log('找到用户:', email, user.id, user.plan_id, user.transfer_enable)
        const plan = await this.getPlanById(user.plan_id)
        return { ...user, plan } as User
      }
      
      console.log('用户不存在:', email)
      return null
    } catch (e) {
      console.error('查询用户失败:', e)
      return null
    }
  }

  async getPlanById(planId: number | null): Promise<any> {
    if (!planId) return null
    
    try {
      const url = this.userApi('plan/fetch')
      const result = await this.request<{ data: any[] }>(url, { method: 'GET' })
      return result.data?.find((p: any) => p.id === planId) || null
    } catch (e) {
      console.error('获取套餐失败:', e)
      return null
    }
  }

  async getPlanList(): Promise<Plan[]> {
    const url = this.userApi('plan/fetch')
    
    try {
      const result = await this.request<{ data: Plan[] }>(url, { method: 'GET' })
      return result.data || []
    } catch (e) {
      console.error('获取套餐列表失败:', e)
      return []
    }
  }

  async verifyCoupon(code: string, planId: number, period: PlanPeriodKey): Promise<any> {
    const url = this.userApi('coupon/check')
    
    try {
      const result = await this.request(url, {
        method: 'POST',
        body: JSON.stringify({
          code,
          plan_id: planId.toString(),
          period,
        }),
      })
      return (result as any).data || null
    } catch (e) {
      console.error('验证优惠券失败:', e)
      return null
    }
  }

  async createUser(email: string, password: string): Promise<string | null> {
    const url = this.adminApi('user/generate')
    
    const emailPrefix = email.split('@')[0]
    const emailSuffix = email.split('@')[1]
    
    try {
      const params = new URLSearchParams({
        email_prefix: emailPrefix,
        email_suffix: emailSuffix,
        password,
      })

      const result = await this.request<{ data: boolean }>(url, {
        method: 'POST',
        body: params.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      if (result.data !== true) {
        throw new Error('创建用户失败')
      }

      const loginUrl = this.passportApi('auth/login')
      const loginResult = await this.request<{ data: { auth_data: string } }>(loginUrl, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      return loginResult.data?.auth_data || null
    } catch (e) {
      console.error('创建用户失败:', e)
      return null
    }
  }

  async createOrder(userToken: string, planId: number, period: PlanPeriodKey, couponCode?: string): Promise<string | null> {
    const url = this.userApi('order/save')
    
    try {
      const result = await this.request<{ data: string }>(url, {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          period,
          ...(couponCode && { coupon_code: couponCode }),
        }),
        headers: {
          'Authorization': userToken,
        },
      })
      
      return result.data || null
    } catch (e) {
      console.error('创建订单失败:', e)
      return null
    }
  }

  async checkoutOrder(userToken: string, tradeNo: string): Promise<boolean> {
    const url = this.userApi('order/checkout')
    
    try {
      const result = await this.request<{ data: boolean }>(url, {
        method: 'POST',
        body: JSON.stringify({
          trade_no: tradeNo,
          method: -1,
        }),
        headers: {
          'Authorization': userToken,
        },
      })
      
      return result.data === true || (result as any).message === '订单已支付'
    } catch (e) {
      console.error('结算订单失败:', e)
      return false
    }
  }

  async cancelUserOrders(targetUserId: number): Promise<void> {
    const url = this.userApi('order/fetch')
    
    try {
      const result = await this.request<{ data: any[] }>(url, {
        method: 'GET',
        headers: {
          'Authorization': this.adminToken!,
          'X-User-ID': targetUserId.toString(),
        },
      })
      
      const orders = result.data || []
      for (const order of orders) {
        if (order.status === 0) {
          console.log(`[取消订单] 取消订单：${order.trade_no}`)
          await this.cancelOrderByUser(targetUserId, order.trade_no)
        }
      }
    } catch (e) {
      console.error('[取消订单] 失败:', e)
    }
  }

  async cancelOrderByUser(targetUserId: number, tradeNo: string): Promise<boolean> {
    const url = this.userApi('order/cancel')
    
    try {
      const result = await this.request<{ data: boolean }>(url, {
        method: 'POST',
        body: JSON.stringify({
          trade_no: tradeNo,
        }),
        headers: {
          'Authorization': this.adminToken!,
          'X-User-ID': targetUserId.toString(),
        },
      })
      
      return result.data === true
    } catch (e) {
      console.error('[取消订单] 失败:', e)
      return false
    }
  }

  async createOrderForUser(
    targetUserId: number,
    planId: number,
    period: PlanPeriodKey,
    couponCode?: string
  ): Promise<string | null> {
    const url = this.userApi('order/save')
    
    await this.cancelUserOrders(targetUserId)
    
    console.log(`[代下单] 用户 ID: ${targetUserId}, 套餐: ${planId}, 周期: ${period}, 优惠券: ${couponCode || '无'}`)
    
    try {
      const result = await this.request<{ data: string }>(url, {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          period,
          ...(couponCode && { coupon_code: couponCode }),
        }),
        headers: {
          'Authorization': this.adminToken!,
          'X-User-ID': targetUserId.toString(),
        },
      })
      
      console.log('[代下单] 响应:', JSON.stringify(result))
      return result.data || null
    } catch (e: any) {
      console.error('[代下单] 失败:', e.message)
      return null
    }
  }

  async checkoutOrderForUser(targetUserId: number, tradeNo: string): Promise<boolean> {
    const url = this.userApi('order/checkout')
    
    try {
      const result = await this.request<{ data: boolean }>(url, {
        method: 'POST',
        body: JSON.stringify({
          trade_no: tradeNo,
          method: -1,
        }),
        headers: {
          'Authorization': this.adminToken!,
          'X-User-ID': targetUserId.toString(),
        },
      })
      
      return result.data === true || (result as any).message === '订单已支付'
    } catch (e) {
      console.error('为指定用户结算订单失败:', e)
      return false
    }
  }

  async exchangeForDistributor(
    email: string,
    planId: number,
    period: PlanPeriodKey,
    couponCode: string
  ): Promise<{
    success: boolean
    message: string
    userId?: number
    tradeNo?: string
  }> {
    try {
      let user = await this.getUserByEmail(email)

      if (!user) {
        const randomPassword = 'TEMP_' + Math.random().toString(36).slice(-8)
        const userToken = await this.createUser(email, randomPassword)
        
        if (!userToken) {
          return { success: false, message: '创建用户失败' }
        }

        user = await this.getUserByEmail(email)
        if (!user) {
          return { success: false, message: '创建用户后查询失败' }
        }

        const coupon = await this.verifyCoupon(couponCode, planId, period)
        if (!coupon) {
          return { success: false, message: '兑换码无效' }
        }

        const tradeNo = await this.createOrder(userToken, planId, period, couponCode)
        if (!tradeNo) {
          return { success: false, message: '创建订单失败' }
        }

        const success = await this.checkoutOrder(userToken, tradeNo)
        if (!success) {
          return { success: false, message: '结算订单失败' }
        }

        return {
          success: true,
          message: '兑换成功',
          userId: user.id,
          tradeNo,
        }
      } else {
        const coupon = await this.verifyCoupon(couponCode, planId, period)
        if (!coupon) {
          return { success: false, message: '兑换码无效' }
        }

        const tradeNo = await this.createOrderForUser(user.id, planId, period, couponCode)
        if (!tradeNo) {
          return { success: false, message: '创建订单失败' }
        }

        const success = await this.checkoutOrderForUser(user.id, tradeNo)
        if (!success) {
          return { success: false, message: '结算订单失败' }
        }

        return {
          success: true,
          message: '兑换成功',
          userId: user.id,
          tradeNo,
        }
      }
    } catch (e) {
      console.error('兑换流程失败:', e)
      return { 
        success: false, 
        message: e instanceof Error ? e.message : '兑换失败' 
      }
    }
  }
}
