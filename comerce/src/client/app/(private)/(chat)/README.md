# Support Chat Frontend

This folder contains the authenticated support chat UI used by customers and support/admin users.

It works with the backend chat module and Socket.IO connection layer.

## What It Supports

- chat list and chat detail UI
- message rendering
- message input
- socket connection handling
- admin socket event handling
- audio playback/recording helpers
- call connecting and in-progress screens
- shared chat styling through `chatTheme.ts`
- loading and error states

## Main Files

| File | Purpose |
| --- | --- |
| `ChatContainer.tsx` | Main chat container |
| `ChatHeader.tsx` | Header/status area |
| `ChatInput.tsx` | Message input |
| `MessageList.tsx` | Message list rendering |
| `MessageItem.tsx` | Individual message rendering |
| `ChatStatus.tsx` | Status display |
| `useChatMessages.ts` | Message fetching/state helper |
| `useSocketConnection.ts` | Socket connection helper |
| `useAdminSocketEvents.ts` | Admin/support socket event handling |
| `useAudio.ts` | Audio helper |
| `useWebRTCCall.ts` | Call state helper |
| `CallConnectingScreen.tsx` | Call connection state |
| `CallInProgressScreen.tsx` | Active call state |
| `CallControls.tsx` | Call controls |
| `chatTheme.ts` | Shared chat styling values |

There is also a `components/` folder with an alternate/refactored component split used by chat-related UI.

## Backend Pairing

Relevant backend files:

- `src/server/src/modules/chat`
- `src/server/src/infra/socket/socket.ts`

Relevant client API file:

- `src/client/app/store/apis/ChatApi.ts`

## Development Notes

- Keep chat-specific components inside this folder unless they are reused elsewhere.
- Keep API calls in `app/store/apis/ChatApi.ts`.
- Keep socket behavior in hooks so UI components stay readable.
- Verify both a customer user and an admin/support user when changing chat behavior.

## Related Documentation

- `../../../../../docs/FEATURES.md`
- `../../../../../docs/ARCHITECTURE.md`
- `../../../../../docs/API_REFERENCE.md`
