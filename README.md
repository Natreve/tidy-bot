# Tidy

Tidy is a telegram Bot designed to streamline the process of managing cleaning schedules for housekeepers. Tidy allows users to view and claim cleaning schedules, track the progress of each task and much more!

The PubSub emulator does not yet support scheduled functions.

## Workaround

```shell
firebase functions:shell

firebase > setInterval(() => ticker(), 60000)
```

This will run the ticker function every 60 seconds.
