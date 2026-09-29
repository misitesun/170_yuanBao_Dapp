# 团队接口

statistics请求GET /api/users/my/statistics，人数保持0有效，业绩保留原字符串。referrals请求GET /api/users/my/referrals，只有直接下级，按id倒序；maddress已脱敏，不再重复处理。等级必须允许null，不能回退到V1。页面概览组合用户资料、统计与邀请码链接，第一页等待所有真实请求，后续页只取成员列表。没有约定业绩单位，不添加Token/USDT后缀。
