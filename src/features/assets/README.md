# 资产接口

余额来源GET /api/users/my。getBalanceLogs统一请求GET /api/balance_logs，usdt/yuanqi/baoqi严格映射balance_usdt/balance_energy/balance_bao，分页每页20条。金额和余额保持字符串，增减只用is_inc决定，content已由后端按lang翻译。列表成功必须含balance_logs数组，无数据为空数组；没有高亮类别或总数，不从备注猜测业务类型。充值、提现、转账不在本模块中。
