const crypto = require('crypto')
const { verifyAdminToken, createAdminToken, hashPassword, verifyPassword } = require('admin-auth')

module.exports = {
	_before: async function () {
		const methodName = this.getMethodName()
		if (methodName === 'login') return

		const clientInfo = this.getClientInfo()
		const token = clientInfo.token
		if (!token) throw new Error('未登录或Token失效')

		try {
			const payload = verifyAdminToken(token, clientInfo)
			if (!payload?.role || !payload.role.includes('admin')) throw new Error('无权访问：非管理员账号')

			const db = uniCloud.database()
			const adminRes = await db.collection('admin_users').doc(payload.uid).get()
			const admin = adminRes.result?.data?.[0]
			if (!admin) throw new Error('未登录或Token失效')
			if (admin.status && admin.status !== 'active') throw new Error('账号已被禁用')

			this.userInfo = { uid: payload.uid, role: payload.role }
		} catch (e) {
			throw new Error('鉴权失败: ' + e.message)
		}
	},

	async login(params) {
		const username = String(params?.username || '').trim()
		const password = String(params?.password || '').trim()
		const fixedUsername = 'admin'
		const fixedPassword = 'Admin@123456'
		if (!username || !password) throw new Error('账号或密码不能为空')

		const db = uniCloud.database()
		// Try to find admin by username
		const docRes = await db.collection('admin_users').where({ username }).limit(1).get()
		let admin = docRes.result?.data?.[0]

		// Initial setup for default admin if not exists
		if (!admin && username === fixedUsername) {
			if (password !== fixedPassword) throw new Error('账号或密码错误')
			const { saltHex, hashHex, iterations, digest } = hashPassword(fixedPassword)
			const now = Date.now()
			const newAdmin = {
				username: fixedUsername,
				salt: saltHex,
				passwordHash: hashHex,
				iterations,
				digest,
				status: 'active',
				create_time: now,
				update_time: now,
			}
			const addRes = await db.collection('admin_users').add(newAdmin)
			admin = { ...newAdmin, _id: addRes.id }
		}

		if (!admin) {
			throw new Error('账号或密码错误')
		}

		if (admin.status && admin.status !== 'active') throw new Error('账号已被禁用')

		const ok = verifyPassword({
			password,
			saltHex: String(admin.salt || ''),
			hashHex: String(admin.passwordHash || ''),
			iterations: Number(admin.iterations || 100000),
			digest: String(admin.digest || 'sha256'),
		})
		if (!ok) throw new Error('账号或密码错误')

		const clientInfo = this.getClientInfo()
		const tokenRes = createAdminToken({ uid: admin._id, role: ['admin'] }, clientInfo)

		return {
			token: tokenRes.token,
			tokenExpired: tokenRes.tokenExpired,
			userInfo: { _id: admin._id, username: admin.username, role: ['admin'] },
		}
	},

	async register(params) {
		// Ensure only admin can create other admins
		if (!this.userInfo || !this.userInfo.role.includes('admin')) {
			throw new Error('无权操作')
		}

		const username = String(params?.username || '').trim()
		if (!username) throw new Error('用户名不能为空')
		
		const db = uniCloud.database()
		const exist = await db.collection('admin_users').where({ username }).count()
		if (exist.total > 0) throw new Error('用户名已存在')
		
		// Dynamic password generation
		let password = params?.password
		if (!password) {
			password = crypto.randomBytes(8).toString('hex')
		}
		
		const { saltHex, hashHex, iterations, digest } = hashPassword(password)
		const now = Date.now()
		
		const res = await db.collection('admin_users').add({
			username,
			salt: saltHex,
			passwordHash: hashHex,
			iterations,
			digest,
			status: 'active',
			create_time: now,
			update_time: now
		})
		
		return {
			id: res.id,
			username,
			password, // Return raw password once
			message: '管理员创建成功'
		}
	},

	async deleteUser(userId) {
		if (!userId) throw new Error('缺少用户ID')
		const db = uniCloud.database()
		await db.collection('users').doc(userId).remove() // 修正集合名称
		return { success: true }
	},

	async auditContent(contentId, status) {
		if (!contentId || !status) throw new Error('参数错误')
		const db = uniCloud.database()
		await db.collection('contents').doc(contentId).update({
			status,
			audit_by: this.userInfo.uid,
			audit_time: Date.now(),
			last_modify_date: Date.now(),
		})
		return { success: true }
	},

	async deleteContent(contentId) {
		if (!contentId) throw new Error('参数错误')
		const db = uniCloud.database()
		await db.collection('contents').doc(contentId).remove()
		return { success: true }
	}
}
