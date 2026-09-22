# dsh-wsl-systemd

> **语言：** **中文**（本页） · [English](./README.en.md)

systemd --user 只读：list / show / journal。

| | |
|---|---|
| 版本 | **0.1.0** |
| 套件 | [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit) **可选**，不在 `install.sh` |

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-systemd
# 或本机 path：
# dsh plugin --profile web add /mnt/c/Users/YOU/Desktop/AIFullStackDevelopment/dsh-wsl-systemd
```

kit 批量链接（可选）：`bash dsh-wsl-kit/scripts/link-linux-plugins.sh`

## 工具

| 工具 | 作用 |
|------|------|
| `systemd_status` | systemctl 是否可用 |
| `systemd_user_list` | 用户服务列表 |
| `systemd_user_show` | 单元状态 |
| `systemd_user_journal` | 近期日志 |

## 配置要点

`timeoutMs`

不能 start/stop/enable。适合查 Ollama 等用户单元。

## License

MIT
