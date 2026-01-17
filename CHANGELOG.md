# Changelog

All notable changes to the OLX Clone project.

## [Latest] - 2026-01-17

### Added
- WhatsApp notification sound for incoming messages
- Online/offline status indicators
- Message delivery tracking (sent → delivered → read)
- Real-time typing indicators
- Browser notifications for new messages
- Conversation delete/hide functionality

### Fixed
- WebSocket zombie chat reconnection issue (`da39f2b`)
- AudioRef ReferenceError crash (`4dcfcc0`, `8f32415`)
- NotificationConsumer syntax error (`238a989`)
- Message status spam in backend (`273f7b9`)
- WebSocket dependency issues causing reconnection storms (`881c8f3`, `cdd4e5d`)
- Online status update logic (`2567f7b`)
- `send_json` AttributeError (`0fc661d`)
- `is_verified` to `email_verified` mapping (`0b50a36`)
- Missing user ID in serializer (`0fc661d`)
- Delete chat navigation with replace flag (`da39f2b`)

### Changed
- Upgraded to production-grade WebSocket consumer with heartbeat (`7085c38`)
- Improved delete chat UX with immediate navigation
- Enhanced error handling in chat system
- Optimized WebSocket connection stability

## [1.0.0] - 2026-01-16

### Added
- Initial release with core marketplace features
- User authentication with JWT
- Product listings with categories
- Image uploads via Cloudinary
- Basic chat functionality
- Email verification system
- User profiles and trust scores

### Infrastructure
- Deployed to Render.com
- PostgreSQL database setup
- Redis for caching and WebSocket channels
- Cloudinary for media storage

---

For detailed commit history, see: https://github.com/mohammadkhasimpathan/olx-clone/commits/main
