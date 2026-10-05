# Plan checklist — System Design Quest

Every chapter of *System Design Interview* Vol. 1 as a world of quests. Ticked = done. Regenerate: `python3 plan/tools/status.py`.

**70 of 83 quests built** · 54 live on the map · 16 built, awaiting world review · 4 being built (draft on disk, not verified) · 9 not started.

Legend: `[x]` done · `[ ]` not done. A world is **done** when every quest is built, the world review has run, its cheat sheet
exists, and its quests are `ready: true` on the map.

## ⬜ World 1 · Scale From Zero to Millions of Users — *The Launchpad*

- [x] `0101` 1.1 · [One Box Wonder](../lessons/0101-scale-one-box-to-load-balancer.html) — built · needs world review
- [x] `0102` 1.2 · [Copy the Ledger](../lessons/0102-scale-database-replication.html) — built · needs world review
- [x] `0103` 1.3 · [Hot Memory, Near Edge](../lessons/0103-scale-cache-and-cdn.html) — built · needs world review
- [x] `0104` 1.4 · [Forget Me, Find Me Anywhere](../lessons/0104-scale-stateless-and-data-centers.html) — built · needs world review
- [x] `0105` 1.5 · [Queues, Gauges & Shards](../lessons/0105-scale-queues-observability-sharding.html) — built · needs world review
- [x] `0106` BOSS · [Zero to Millions, Live](../lessons/0106-scale-boss-millions-live.html) — built · needs world review
- [ ] World review + cheat sheet

## ✅ World 2 · Back-of-the-Envelope Estimation — *The Napkin Forge*

- [x] `0201` 2.1 · [The Byte Ladder](../lessons/0201-powers-of-two.html) — live
- [x] `0202` 2.2 · [Nanoseconds to Netherlands](../lessons/0202-latency-numbers.html) — live
- [x] `0203` 2.3 · [Count the Nines](../lessons/0203-availability-nines.html) — live
- [x] `0204` 2.4 · [Tweet Math](../lessons/0204-twitter-qps-storage.html) — live
- [x] `0205` BOSS · [The Estimation Gauntlet](../lessons/0205-boss-estimation-gauntlet.html) — live
- [x] World review + cheat sheet — [ch02-estimation-cheatsheet.html](../reference/ch02-estimation-cheatsheet.html)

## ✅ World 3 · A Framework for System Design Interviews — *The Interview Arena*

- [x] `0301` 3.1 · [Rules of the Room](../lessons/0301-rules-of-the-room.html) — live
- [x] `0302` 3.2 · [Ask Before You Build](../lessons/0302-ask-before-you-build.html) — live
- [x] `0303` 3.3 · [Blueprint & Buy-in](../lessons/0303-blueprint-and-buy-in.html) — live
- [x] `0304` 3.4 · [Dive Deep, Land Clean](../lessons/0304-dive-deep-land-clean.html) — live
- [x] `0305` BOSS · [Run the Room](../lessons/0305-boss-run-the-room.html) — live
- [x] World review + cheat sheet — [ch03-framework-cheatsheet.html](../reference/ch03-framework-cheatsheet.html)

## ✅ World 4 · Design a Rate Limiter — *The Throttle Gate*

- [x] `0401` 4.1 · [Bouncer at the Door](../lessons/0401-rate-limiter-why-and-where.html) — live
- [x] `0402` 4.2 · [Token Tycoon](../lessons/0402-token-and-leaking-bucket.html) — live
- [x] `0403` 4.3 · [Windows of Time](../lessons/0403-window-algorithms.html) — live
- [x] `0404` 4.4 · [The Counter Room](../lessons/0404-counters-rules-and-429s.html) — live
- [x] `0405` 4.5 · [Many Doors, One Count](../lessons/0405-distributed-rate-limiting.html) — live
- [x] `0406` BOSS · [Throttle It Live](../lessons/0406-boss-throttle-it-live.html) — live
- [x] World review + cheat sheet — [ch04-rate-limiter-cheatsheet.html](../reference/ch04-rate-limiter-cheatsheet.html)

## ✅ World 5 · Design Consistent Hashing — *The Ring Road*

- [x] `0501` 5.1 · [Ring Math](../lessons/0501-consistent-hashing-ring-math.html) — live
- [x] `0502` 5.2 · [Cracks in the Ring](../lessons/0502-consistent-hashing-cracks-and-riders.html) — live
- [x] `0503` BOSS · [Hash It Live](../lessons/0503-consistent-hashing-boss-hash-it-live.html) — live
- [x] World review + cheat sheet — [ch05-consistent-hashing-cheatsheet.html](../reference/ch05-consistent-hashing-cheatsheet.html)

## ✅ World 6 · Design a Key-Value Store — *The Key-Value Vault*

- [x] `0001` 6.1 · [The Key-Value Vault](../lessons/0001-key-value-store-and-cap.html) — live
- [x] `0002` 6.2 · [Slice the Keyspace](../lessons/0002-consistent-hashing.html) — live
- [x] `0003` 6.3 · [Copies Everywhere](../lessons/0003-replication.html) — live
- [x] `0004` 6.4 · [Majority Rules](../lessons/0004-quorum-consensus.html) — live
- [x] `0005` 6.5 · [Who Wrote Last?](../lessons/0005-vector-clocks.html) — live
- [x] `0006` 6.6 · [When Nodes Die](../lessons/0006-handling-failures.html) — live
- [x] `0007` 6.7 · [The Write & Read Path](../lessons/0007-write-and-read-path.html) — live
- [x] `0008` BOSS · [Design It Live](../lessons/0008-boss-design-it-live.html) — live
- [x] World review + cheat sheet — [kv-store-cap-cheatsheet.html](../reference/kv-store-cap-cheatsheet.html)

## ✅ World 7 · Design a Unique ID Generator — *The ID Mint*

- [x] `0701` 7.1 · [Numbers Nobody Repeats](../lessons/0701-unique-id-scope-and-multi-master.html) — live
- [x] `0702` 7.2 · [Dice or the Ticket Booth](../lessons/0702-uuid-and-ticket-server.html) — live
- [x] `0703` 7.3 · [Anatomy of a Snowflake](../lessons/0703-snowflake-bit-layout.html) — live
- [x] `0704` 7.4 · [When Clocks Lie](../lessons/0704-snowflake-clocks-and-tuning.html) — live
- [x] `0705` BOSS · [Mint It Live](../lessons/0705-boss-mint-it-live.html) — live
- [x] World review + cheat sheet — [ch07-unique-id-cheatsheet.html](../reference/ch07-unique-id-cheatsheet.html)

## ✅ World 8 · Design a URL Shortener — *Shrink Ray Bay*

- [x] `0801` 8.1 · [Specs for a Shrink Ray](../lessons/0801-url-shortener-scope-and-api.html) — live
- [x] `0802` 8.2 · [Seven Characters or Bust](../lessons/0802-url-shortener-hash-and-collisions.html) — live
- [x] `0803` 8.3 · [Count in Base 62](../lessons/0803-url-shortener-base62.html) — live
- [x] `0804` 8.4 · [Shorten & Bounce](../lessons/0804-url-shortener-flows-and-scale.html) — live
- [x] `0805` BOSS · [Shrink the Internet, Live](../lessons/0805-url-shortener-boss-design-it-live.html) — live
- [x] World review + cheat sheet — [ch08-url-shortener-cheatsheet.html](../reference/ch08-url-shortener-cheatsheet.html)

## ⬜ World 9 · Design a Web Crawler — *Spider Web Wilds*

- [x] `0901` 9.1 · [Release the Spider](../lessons/0901-web-crawler-scope-and-estimates.html) — built · needs world review
- [x] `0902` 9.2 · [Assemble the Spider](../lessons/0902-web-crawler-components-and-workflow.html) — built · needs world review
- [x] `0903` 9.3 · [Taming the Frontier](../lessons/0903-web-crawler-url-frontier.html) — built · needs world review
- [x] `0904` 9.4 · [Fast Fangs, Thick Skin](../lessons/0904-web-crawler-downloader-and-robustness.html) — built · needs world review
- [x] `0905` 9.5 · [Beware the Spider Traps](../lessons/0905-web-crawler-traps-and-extensibility.html) — built · needs world review
- [x] `0906` BOSS · [Crawl the Web, Live](../lessons/0906-web-crawler-boss-design-it-live.html) — built · needs world review
- [ ] World review + cheat sheet

## ✅ World 10 · Design a Notification System — *Ping Station*

- [x] `1001` 10.1 · [Three Roads to the Lock Screen](../lessons/1001-notification-channels.html) — live
- [x] `1002` 10.2 · [Shatter the Single Server](../lessons/1002-notification-high-level-design.html) — live
- [x] `1003` 10.3 · [Never Lose a Ping](../lessons/1003-notification-reliability.html) — live
- [x] `1004` 10.4 · [Respect the Inbox](../lessons/1004-notification-guardrails.html) — live
- [x] `1005` BOSS · [Ping the Planet — Live](../lessons/1005-notification-boss-design-it-live.html) — live
- [x] World review + cheat sheet — [ch10-notification-cheatsheet.html](../reference/ch10-notification-cheatsheet.html)

## ⬜ World 11 · Design a News Feed System — *Feedstream Falls*

- [x] `1101` 11.1 · [Two Rivers](../lessons/1101-news-feed-scope-and-flows.html) — built · needs world review
- [x] `1102` 11.2 · [Push, Pull, or Both](../lessons/1102-news-feed-fanout-push-vs-pull.html) — built · needs world review
- [x] `1103` 11.3 · [The Fanout Factory](../lessons/1103-news-feed-publishing-pipeline.html) — built · needs world review
- [ ] `1104` 11.4 · [Hydrate the Feed](../lessons/1104-news-feed-retrieval-and-caches.html) — being built (unverified draft)
- [ ] `1105` BOSS · [Design It Live: News Feed](../lessons/1105-news-feed-boss-design-it-live.html) — not started
- [ ] World review + cheat sheet

## ✅ World 12 · Design a Chat System — *Chatterbox Citadel*

- [x] `1201` 12.1 · [Open the Pipe](../lessons/1201-chat-connections.html) — live
- [x] `1202` 12.2 · [The Switchboard](../lessons/1202-chat-high-level-design.html) — live
- [x] `1203` 12.3 · [The Message Vault](../lessons/1203-chat-storage-and-ids.html) — live
- [x] `1204` 12.4 · [Special Delivery](../lessons/1204-chat-message-flows.html) — live
- [x] `1205` 12.5 · [The Green Dot](../lessons/1205-chat-online-presence.html) — live
- [x] `1206` BOSS · [Design It Live: Chat](../lessons/1206-chat-boss-design-it-live.html) — live
- [x] World review + cheat sheet — [ch12-chat-cheatsheet.html](../reference/ch12-chat-cheatsheet.html)

## ⬜ World 13 · Design a Search Autocomplete System — *Typeahead Tower*

- [x] `1301` 13.1 · [Every Keystroke Counts](../lessons/1301-autocomplete-scope-and-estimation.html) — built · needs world review
- [ ] `1302` 13.2 · [Grow the Trie](../lessons/1302-trie-top-k.html) — being built (unverified draft)
- [ ] `1303` 13.3 · [The Weekly Harvest](../lessons/1303-data-gathering-service.html) — not started
- [ ] `1304` 13.4 · [Faster Than a Keystroke](../lessons/1304-query-service.html) — being built (unverified draft)
- [ ] `1305` 13.5 · [Split the Alphabet](../lessons/1305-scaling-autocomplete.html) — not started
- [ ] `1306` BOSS · [Autocomplete Live](../lessons/1306-boss-autocomplete-live.html) — not started
- [ ] World review + cheat sheet

## ⬜ World 14 · Design YouTube — *The Stream Machine*

- [ ] `1401` 14.1 · [Size Up the Tube](../lessons/1401-youtube-scope-and-estimate.html) — being built (unverified draft)
- [ ] `1402` 14.2 · [Upload Lane, Watch Lane](../lessons/1402-youtube-upload-and-stream-flows.html) — not started
- [ ] `1403` 14.3 · [The Format Forge](../lessons/1403-youtube-transcoding-and-dag.html) — not started
- [ ] `1404` 14.4 · [The Transcoding Factory](../lessons/1404-youtube-transcoding-architecture.html) — not started
- [ ] `1405` 14.5 · [Faster, Safer, Cheaper](../lessons/1405-youtube-optimizations-and-errors.html) — not started
- [ ] `1406` BOSS · [Design YouTube Live](../lessons/1406-youtube-boss-design-it-live.html) — not started
- [ ] World review + cheat sheet

## ✅ World 15 · Design Google Drive — *The Cloud Locker*

- [x] `1501` 15.1 · [Claim Your Locker](../lessons/1501-drive-scope-and-apis.html) — live
- [x] `1502` 15.2 · [Chop It Into Blocks](../lessons/1502-drive-blocks-and-delta-sync.html) — live
- [x] `1503` 15.3 · [The Metadata Ledger](../lessons/1503-drive-metadata-and-conflicts.html) — live
- [x] `1504` 15.4 · [Ping When It Changes](../lessons/1504-drive-upload-download-notify.html) — live
- [x] `1505` 15.5 · [Thrift & Chaos](../lessons/1505-drive-storage-and-failures.html) — live
- [x] `1506` BOSS · [Design Drive Live](../lessons/1506-drive-boss-design-it-live.html) — live
- [x] World review + cheat sheet — [ch15-google-drive-cheatsheet.html](../reference/ch15-google-drive-cheatsheet.html)

## Next steps

1. Build every unticked quest from `plan/quests/quest-<id>.json` with `plan/BRIEF.md` (order: `plan/queue.txt`).
2. When a world's quests are all built, run the world finisher (`plan/WORLD-BRIEF.md`), then `plan/tools/release.py <N>`.
3. Final pass: quest map + every cheat-sheet link, `NOTES.md` update.
