
interface Identity {
  login_name: string,
  userIdInIdp: string,
  identity: string,
  user_name: string,
  accessToken: string
}

// 用户账号数据类型
export interface UserInfoT {
  photo: string; // 头像
  username: string; // 用户名
  email: string; // 邮箱
  phoneCountryCode: string, // 区号
  phone: string, // 手机号
  identities: Identity[]; // 身份
}
