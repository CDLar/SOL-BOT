# WARLOCK BOT - Running Instructions

## Starting the Bot (after a reboot)

Navigate to the project folder and run:

```bash
cd "C:\Users\curti\Documents\Projects\WARLOCK_BOT"
pm2 start index.js --name sol-bot
```

This runs the bot silently in the background. No terminal needs to stay open.
Locking your screen (Win + L) will NOT stop it.

---

## Useful PM2 Commands

```bash
pm2 status          # check if the bot is running
pm2 logs sol-bot    # view live logs
pm2 restart sol-bot # restart the bot
pm2 stop sol-bot    # stop the bot
```

---

## Notes

- PM2 must be restarted manually after a full PC reboot
- Sleep mode will pause the bot — set Windows power settings to "Never sleep" if uptime matters
- The bot uses ~60MB RAM at idle
