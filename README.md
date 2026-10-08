# JSON 小工具

纯前端的 JSON 美化与对比小工具：美化 / 压缩 / 校验 / 对比，全程在浏览器本地计算，不上传任何数据。

## 本地运行

直接用浏览器打开 `index.html` 即可；也可以起一个静态服务：

```bash
cd json-tools
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 部署到 Vercel

1. 把本目录推送到 GitHub 仓库
2. 在 Vercel 里 Import 该仓库，Framework Preset 选 Other，其余保持默认（无需构建命令，`index.html` 即入口）
3. Deploy，得到 `xxx.vercel.app` 访问地址

## 路线图

- [ ] 绑定自有域名
- [ ] 用 Cloudflare 管理 DNS（域名解析）
