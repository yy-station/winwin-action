# winwin行动（Codex 托管版）

个人成长工作台（内容与形式与原版一致）：首页仪表盘 / 今日计划 / 学习计划 / 运动打卡 / 养生护肤 / 旅行 / 保险 / 今日复盘 / 英语词典 等。

- 数据：Supabase（`gewxrwazfqgkaquiivou`）+ 本地缓存；登录后自动从 Supabase 恢复全部数据，换链接不丢数据。
- 部署：GitHub Pages（Codex 直接 push 即上线，链接会变为 `https://<用户名>.github.io/winwin-action/`）。
- 维护：后续改动由 Codex（Project_11）负责，WorkBuddy/CloudStudio 不再参与。

## 本地预览
```bash
cd winwin_action && python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 部署（由 Codex 执行）
```bash
./deploy.sh <你的GitHub用户名>
```
