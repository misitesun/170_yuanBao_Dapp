# 团队业绩排行榜

getTeamRanking 使用登录 GET /api/rankings/team_kpi，无分页与筛选参数，支持 AbortSignal。解析裸对象 list/me，仅验证页面消费的 rank/address/team_kpi，金额字符串原样显示，kpi 当前不展示。列表最多50条，按服务端顺序显示，不做客户端排序或补榜。me.rank=0 表示未上榜，可以大于50。接口不提供 me.address，页面按开发者要求展示已有钱包状态中的当前连接地址，不补取其他接口。

契约见 docs/yuanbao-rankings-contract.md。日期和清零规则由服务端负责，前端不轮询、不用本机时间清空排名。
