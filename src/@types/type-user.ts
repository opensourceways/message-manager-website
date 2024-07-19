// 用户账号数据类型
export interface UserInfoT {
  id: string; // id
  account: string; // 账号
  fullname: string; // 昵称
  description: string; // 个人简介
  email: string; // 邮箱
  avatar_id: string; // 头像
}

// 游客账号数据类型
export interface VisitorInfoT {
  id: string; // id
  account: string; // 个人账号/组织名
  fullname: string; // 昵称
  email?: string; // 邮箱
  description: string; // 个人简介
  avatar_id: string; // 头像
  type?: number; // 账号类型 0-个人 1-组织
}

// token类型
export interface TokenT {
  account?: string; // 用户名
  created_at?: number; // 创建时间
  updated_at?: number; // 更新时间
  expired?: number; // 过期
  name?: string; //  // token名
  permission?: string; // 权限
  token?: string; // token
}

// 个人中心热门数据类型
export interface ModelOrSpaceT {
  avatar_id: string; // 头像
  id: string; // id
  name: string; // 仓库名称
  desc: string; // 简介
  task: string; // 标签
  owner: string; // 拥有者
  fullname: string; // 名称
  updated_at: number; // 更新时间
  like_count: number; // like数量
  download_count?: number; // 下载量
  type?: number; // 1-模型 2-空间
  owner_type: number; // 0-个人 1-组织
}

// 简单的用户信息，只包含用户名、头像、昵称
export interface SimpleUserInfo {
  userame: string; // 用户名
  photo: string; // 头像
  nickname: string; // 昵称
}