# @jcy/create-template-react
React H5 DApp 模板创建工具。

Build the local package from the template repository.
先从模板仓库生成本地包。

```bash
cd /Users/jcy/React/template
pnpm create:local
```

Create a project in an empty directory.
在空目录中创建项目。

```bash
pnpm dlx /Users/jcy/React/template/packages/create-template-react/jcy-create-template-react-0.1.0.tgz .
```

Then install dependencies and start the project.
然后安装依赖并启动项目。

```bash
cd my-app
pnpm install
pnpm dev
```
