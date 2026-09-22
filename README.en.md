# dsh-wsl-systemd

> **Languages:** [中文（首页）](./README.md) · **English** (this file)

systemd --user read-only list/show/journal.

| | |
|---|---|
| Version | **0.1.0** |
| Kit | Optional companion to [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit); not in `install.sh` |

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-systemd
```

Batch link (optional): `bash dsh-wsl-kit/scripts/link-linux-plugins.sh`

## Tools

| Tool | Role |
|------|------|
| `systemd_status` | systemctl on PATH |
| `systemd_user_list` | list user units |
| `systemd_user_show` | show unit |
| `systemd_user_journal` | journal tail |

## Config

`timeoutMs`

No start/stop/enable. Useful for Ollama user units.

## License

MIT
