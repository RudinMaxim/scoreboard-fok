# mcu-firmware

C++ firmware skeleton for future hardware remotes.

Current state: infrastructure skeleton only. Board choice, toolchain, transport and firmware implementation are intentionally deferred.

Planned responsibilities:

- read physical buttons;
- debounce input;
- assign `deviceId` and monotonic `seq` to input events;
- send input events to Node.js backend / input gateway;
- receive confirmed state snapshots or heartbeat;
- show local `NO LINK` state when disconnected;
- use watchdog reset for firmware recovery.

Not responsible for:

- official match time truth;
- FIBA validation;
- score, fouls, timeouts or periods;
- database writes;
- direct business commands to Timer Service.

Planned layout:

- `firmware/include/` - shared firmware headers;
- `firmware/src/` - board-specific and transport code;
- `firmware/tests/` - host-side tests where possible.

Repository commands:

```bash
npm run nx -- run mcu-firmware:build
npm run nx -- run mcu-firmware:test
npm run nx -- run mcu-firmware:lint
```
