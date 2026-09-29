# Features

元宝项目已确认的业务能力按auth/user/notices/team/assets分组。接口统一调用src/services/http，网络成功数据从unknown校验为领域模型，不以泛型证明PHP数据。auth编排钱包授权和跨页面资料，user负责用户DTO，notices负责公告与安全正文，team/assets只封装已文档化读取。api-fields.ts包含这些接口共用的字段检查及分页大小。页面service组合真实请求及视图映射，保留正常页面模块结构。模板默认流程不作为本项目事实；原始契约见docs/yuanbao-api-contract.md，接入范围与待确认项见docs/yuanbao-api-integration.md。充值/提现/转账和订单功能不属于已接入能力。
